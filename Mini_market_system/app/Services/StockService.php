<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class StockService
{
    public function increase(
        Product $product,
        float|int|string $quantity,
        User $user,
        string $reason,
        ?Model $reference = null,
    ): StockMovement {
        return $this->move(
            $product,
            $quantity,
            $user,
            StockMovement::TYPE_PURCHASE,
            StockMovement::DIRECTION_IN,
            $reason,
            $reference,
        );
    }

    public function decrease(
        Product $product,
        float|int|string $quantity,
        User $user,
        string $reason,
        ?Model $reference = null,
    ): StockMovement {
        return $this->move(
            $product,
            $quantity,
            $user,
            StockMovement::TYPE_SALE,
            StockMovement::DIRECTION_OUT,
            $reason,
            $reference,
        );
    }

    public function recordReturn(
        Product $product,
        float|int|string $quantity,
        User $user,
        string $direction,
        string $reason,
        ?Model $reference = null,
    ): StockMovement {
        return $this->move(
            $product,
            $quantity,
            $user,
            StockMovement::TYPE_RETURN,
            $direction,
            $reason,
            $reference,
        );
    }

    public function adjust(
        Product $product,
        float|int|string $quantity,
        string $direction,
        User $user,
        string $reason,
    ): StockMovement {
        return $this->move(
            $product,
            $quantity,
            $user,
            StockMovement::TYPE_ADJUSTMENT,
            $direction,
            $reason,
            null,
        );
    }

    private function move(
        Product $product,
        float|int|string $quantity,
        User $user,
        string $type,
        string $direction,
        string $reason,
        ?Model $reference,
    ): StockMovement {
        $qty = round((float) $quantity, 3);

        if ($qty <= 0) {
            throw new InsufficientStockException('Quantity must be greater than zero.');
        }

        return DB::transaction(function () use ($product, $qty, $user, $type, $direction, $reason, $reference) {
            $locked = Product::query()->lockForUpdate()->findOrFail($product->id);

            if ($locked->unit === Product::UNIT_PIECE && round($qty, 3) !== round($qty, 0)) {
                throw new InsufficientStockException(
                    'This product is sold by the piece. Use a whole number.',
                );
            }

            $before = (float) $locked->stock_quantity;
            $after = $direction === StockMovement::DIRECTION_IN
                ? $before + $qty
                : $before - $qty;

            if ($after < 0) {
                throw new InsufficientStockException(
                    'Not enough stock for '.$locked->name.'.',
                );
            }

            $locked->update(['stock_quantity' => $after]);

            return StockMovement::query()->create([
                'product_id' => $locked->id,
                'user_id' => $user->id,
                'type' => $type,
                'direction' => $direction,
                'quantity' => $qty,
                'quantity_before' => $before,
                'quantity_after' => $after,
                'reference_type' => $reference?->getMorphClass(),
                'reference_id' => $reference?->getKey(),
                'reason' => $reason,
            ]);
        });
    }
}
