<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\CashSession;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleService
{
    public function __construct(private StockService $stock)
    {
    }

    /**
     * @param  list<array{product_id: int, quantity: float|int|string}>  $items
     */
    public function checkout(User $user, array $items, float|int|string $amountPaid): Sale
    {
        return DB::transaction(function () use ($user, $items, $amountPaid) {
            $session = CashSession::query()
                ->where('user_id', $user->id)
                ->where('status', CashSession::STATUS_OPEN)
                ->lockForUpdate()
                ->first();

            if ($session === null) {
                throw ValidationException::withMessages([
                    'cash_session' => 'Open the caisse before selling.',
                ]);
            }

            $lines = [];
            $total = 0.0;

            foreach ($items as $item) {
                $product = Product::query()->lockForUpdate()->findOrFail($item['product_id']);

                if (! $product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => $product->name.' is disabled and cannot be sold.',
                    ]);
                }

                $quantity = round((float) $item['quantity'], 3);
                $unitPrice = (float) $product->sale_price;
                $total += $quantity * $unitPrice;
                $lines[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                ];
            }

            $total = round($total, 2);
            $paid = round((float) $amountPaid, 2);

            if ($paid < $total) {
                throw ValidationException::withMessages([
                    'amount_paid' => 'Amount paid is less than the total.',
                ]);
            }

            $sale = Sale::query()->create([
                'reference' => Sale::nextReference(),
                'user_id' => $user->id,
                'cash_session_id' => $session->id,
                'status' => Sale::STATUS_COMPLETED,
                'total' => $total,
                'amount_paid' => $paid,
                'change_amount' => round($paid - $total, 2),
            ]);

            foreach ($lines as $line) {
                SaleItem::query()->create([
                    'sale_id' => $sale->id,
                    'product_id' => $line['product']->id,
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                ]);

                try {
                    $this->stock->decrease(
                        $line['product'],
                        $line['quantity'],
                        $user,
                        StockMovement::TYPE_SALE,
                        $sale,
                    );
                } catch (InsufficientStockException $exception) {
                    throw ValidationException::withMessages([
                        'items' => $exception->getMessage(),
                    ]);
                }
            }

            return $sale->fresh(['items.product', 'user']) ?? $sale;
        });
    }
}
