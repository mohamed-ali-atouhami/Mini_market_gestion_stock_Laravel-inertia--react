<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseService
{
    public function __construct(private StockService $stock)
    {
    }

    /**
     * @param  array{
     *     supplier_id: int,
     *     purchase_date: string,
     *     invoice_number?: string|null,
     *     notes?: string|null,
     *     items: list<array{product_id: int, quantity: float|int|string, unit_cost: float|int|string}>
     * }  $data
     */
    public function saveDraft(array $data, User $user, ?Purchase $purchase = null): Purchase
    {
        return DB::transaction(function () use ($data, $user, $purchase) {
            if ($purchase !== null && $purchase->status !== Purchase::STATUS_DRAFT) {
                throw ValidationException::withMessages([
                    'status' => 'Only a draft delivery can be edited.',
                ]);
            }

            $items = $this->mergeItems($data['items']);
            $total = $this->total($items);

            if ($purchase === null) {
                $purchase = Purchase::query()->create([
                    'reference' => Purchase::nextReference(),
                    'supplier_id' => $data['supplier_id'],
                    'user_id' => $user->id,
                    'invoice_number' => $data['invoice_number'] ?? null,
                    'status' => Purchase::STATUS_DRAFT,
                    'purchase_date' => $data['purchase_date'],
                    'notes' => $data['notes'] ?? null,
                    'total' => $total,
                ]);
            } else {
                $purchase->update([
                    'supplier_id' => $data['supplier_id'],
                    'invoice_number' => $data['invoice_number'] ?? null,
                    'purchase_date' => $data['purchase_date'],
                    'notes' => $data['notes'] ?? null,
                    'total' => $total,
                ]);
                $purchase->items()->delete();
            }

            foreach ($items as $item) {
                PurchaseItem::query()->create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                ]);
            }

            return $purchase->fresh(['items.product', 'supplier']) ?? $purchase;
        });
    }

    /**
     * @param  array{
     *     supplier_id: int,
     *     purchase_date: string,
     *     invoice_number?: string|null,
     *     notes?: string|null,
     *     items: list<array{product_id: int, quantity: float|int|string, unit_cost: float|int|string}>
     * }  $data
     */
    public function saveAndReceive(array $data, User $user, ?Purchase $purchase = null): Purchase
    {
        return DB::transaction(function () use ($data, $user, $purchase) {
            $purchase = $this->saveDraft($data, $user, $purchase);

            return $this->receive($purchase, $user);
        });
    }

    public function receive(Purchase $purchase, User $user): Purchase
    {
        return DB::transaction(function () use ($purchase, $user) {
            $locked = Purchase::query()->lockForUpdate()->findOrFail($purchase->id);

            if ($locked->status !== Purchase::STATUS_DRAFT) {
                throw ValidationException::withMessages([
                    'status' => 'This delivery was already received or cancelled.',
                ]);
            }

            $locked->load('items.product');

            if ($locked->items->isEmpty()) {
                throw ValidationException::withMessages([
                    'items' => 'Add at least one product before receiving.',
                ]);
            }

            foreach ($locked->items as $item) {
                $product = $item->product;

                if ($product === null || ! $product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => ($product?->name ?? 'A product').' is disabled and cannot be received.',
                    ]);
                }

                $movement = $this->stock->increase(
                    $product,
                    $item->quantity,
                    $user,
                    StockMovement::TYPE_PURCHASE,
                    $locked,
                );

                $this->updateProductCost(
                    $product,
                    (float) $movement->quantity_before,
                    (float) $movement->quantity,
                    (float) $item->unit_cost,
                );
            }

            $locked->update([
                'status' => Purchase::STATUS_RECEIVED,
                'user_id' => $user->id,
            ]);

            return $locked->fresh(['items.product', 'supplier']) ?? $locked;
        });
    }

    public function cancel(Purchase $purchase): Purchase
    {
        if ($purchase->status !== Purchase::STATUS_DRAFT) {
            throw ValidationException::withMessages([
                'status' => 'Only a draft delivery can be cancelled.',
            ]);
        }

        $purchase->update([
            'status' => Purchase::STATUS_CANCELLED,
        ]);

        return $purchase->refresh();
    }

    /**
     * @param  list<array{product_id: int, quantity: float|int|string, unit_cost: float|int|string}>  $items
     * @return list<array{product_id: int, quantity: float, unit_cost: float}>
     */
    private function mergeItems(array $items): array
    {
        $merged = [];

        foreach ($items as $item) {
            $productId = (int) $item['product_id'];
            $quantity = round((float) $item['quantity'], 3);
            $unitCost = round((float) $item['unit_cost'], 2);

            if (! isset($merged[$productId])) {
                $merged[$productId] = [
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                ];

                continue;
            }

            $previousQty = $merged[$productId]['quantity'];
            $previousCost = $merged[$productId]['unit_cost'];
            $nextQty = round($previousQty + $quantity, 3);
            $merged[$productId]['quantity'] = $nextQty;
            $merged[$productId]['unit_cost'] = $nextQty > 0
                ? round((($previousQty * $previousCost) + ($quantity * $unitCost)) / $nextQty, 2)
                : $unitCost;
        }

        return array_values($merged);
    }

    private function updateProductCost(
        Product $product,
        float $quantityBefore,
        float $incomingQuantity,
        float $incomingCost,
    ): void {
        $locked = Product::query()->lockForUpdate()->findOrFail($product->id);
        $after = $quantityBefore + $incomingQuantity;

        if ($after <= 0) {
            return;
        }

        $average = $quantityBefore <= 0
            ? $incomingCost
            : (($quantityBefore * (float) $locked->cost_price) + ($incomingQuantity * $incomingCost)) / $after;

        $locked->update([
            'cost_price' => round($average, 2),
        ]);
    }

    /**
     * @param  list<array{quantity: float|int|string, unit_cost: float|int|string}>  $items
     */
    private function total(array $items): string
    {
        $sum = 0.0;

        foreach ($items as $item) {
            $sum += (float) $item['quantity'] * (float) $item['unit_cost'];
        }

        return number_format($sum, 2, '.', '');
    }
}
