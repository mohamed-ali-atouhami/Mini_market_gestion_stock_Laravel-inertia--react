<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\CashSession;
use App\Models\CustomerReturn;
use App\Models\CustomerReturnItem;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReturnService
{
    public function __construct(private StockService $stock)
    {
    }

    /**
     * @param  array{
     *     items: list<array{
     *         action: string,
     *         condition: string,
     *         returned_product_id: int,
     *         returned_quantity: float|int|string,
     *         replacement_product_id?: int|null,
     *         replacement_quantity?: float|int|string|null,
     *         supplier_id?: int|null
     *     }>,
     *     amount_paid?: float|int|string|null,
     *     reason?: string|null
     * }  $data
     */
    public function record(User $user, array $data): CustomerReturn
    {
        return DB::transaction(function () use ($user, $data) {
            $session = CashSession::query()
                ->where('user_id', $user->id)
                ->where('status', CashSession::STATUS_OPEN)
                ->lockForUpdate()
                ->first();

            if ($session === null) {
                throw ValidationException::withMessages([
                    'cash_session' => 'Open the caisse before returns.',
                ]);
            }

            $items = $data['items'] ?? [];

            if ($items === []) {
                throw ValidationException::withMessages([
                    'items' => 'Scan the product they brought back.',
                ]);
            }

            $productIds = [];

            foreach ($items as $item) {
                $productIds[] = (int) $item['returned_product_id'];

                if (($item['action'] ?? '') === CustomerReturn::ACTION_REPLACE
                    && ! empty($item['replacement_product_id'])) {
                    $productIds[] = (int) $item['replacement_product_id'];
                }
            }

            $productIds = array_values(array_unique($productIds));
            sort($productIds);

            $locked = [];

            foreach ($productIds as $id) {
                $locked[$id] = Product::query()->lockForUpdate()->findOrFail($id);
            }

            $parsed = [];
            $returnedValue = 0.0;
            $replacementValue = 0.0;

            foreach ($items as $index => $item) {
                $parsed[] = $this->parseItem($item, $index, $locked);
                $returnedValue = round($returnedValue + $parsed[$index]['returned_value'], 2);
                $replacementValue = round($replacementValue + $parsed[$index]['replacement_value'], 2);
            }

            $cashDelta = round($replacementValue - $returnedValue, 2);
            $amountPaid = null;
            $changeAmount = null;

            if ($cashDelta > 0) {
                if (! array_key_exists('amount_paid', $data) || $data['amount_paid'] === null || $data['amount_paid'] === '') {
                    throw ValidationException::withMessages([
                        'amount_paid' => 'Enter the amount paid.',
                    ]);
                }

                $paid = round((float) $data['amount_paid'], 2);

                if ($paid < $cashDelta) {
                    throw ValidationException::withMessages([
                        'amount_paid' => 'Amount paid is less than the total.',
                    ]);
                }

                $amountPaid = $paid;
                $changeAmount = round($paid - $cashDelta, 2);
            }

            $row = CustomerReturn::query()->create([
                'reference' => CustomerReturn::nextReference(),
                'user_id' => $user->id,
                'cash_session_id' => $session->id,
                'cash_delta' => $cashDelta,
                'amount_paid' => $amountPaid,
                'change_amount' => $changeAmount,
                'reason' => $data['reason'] ?? null,
            ]);

            $stockOut = [];

            foreach ($parsed as $index => $line) {
                $row->items()->create([
                    'action' => $line['action'],
                    'condition' => $line['condition'],
                    'returned_product_id' => $line['returned']->id,
                    'returned_quantity' => $line['returned_qty'],
                    'returned_unit_price' => $line['returned_price'],
                    'returned_value' => $line['returned_value'],
                    'replacement_product_id' => $line['replacement']?->id,
                    'replacement_quantity' => $line['replacement_qty'],
                    'replacement_unit_price' => $line['replacement_price'],
                    'replacement_value' => $line['action'] === CustomerReturn::ACTION_REPLACE
                        ? $line['replacement_value']
                        : null,
                    'supplier_id' => $line['supplier_id'],
                    'supplier_status' => $line['supplier_status'],
                ]);

                if ($line['condition'] === CustomerReturn::CONDITION_SELLABLE) {
                    $this->stock->recordReturn(
                        $line['returned'],
                        $line['returned_qty'],
                        $user,
                        StockMovement::DIRECTION_IN,
                        'customer return',
                        $row,
                    );
                }

                if ($line['action'] === CustomerReturn::ACTION_REPLACE
                    && $line['replacement'] !== null
                    && $line['replacement_qty'] !== null) {
                    $stockOut[] = [
                        'index' => $index,
                        'product' => $line['replacement'],
                        'quantity' => $line['replacement_qty'],
                        'reason' => 'replacement for '.$line['returned']->name,
                    ];
                }
            }

            foreach ($stockOut as $out) {
                try {
                    $this->stock->recordReturn(
                        $out['product'],
                        $out['quantity'],
                        $user,
                        StockMovement::DIRECTION_OUT,
                        $out['reason'],
                        $row,
                    );
                } catch (InsufficientStockException $exception) {
                    throw ValidationException::withMessages([
                        "items.{$out['index']}.replacement_product_id" => $exception->getMessage(),
                    ]);
                }
            }

            return $row->fresh(['items.returnedProduct', 'items.replacementProduct', 'items.supplier', 'user']) ?? $row;
        });
    }

    public function giveToSupplier(User $user, CustomerReturnItem $item): CustomerReturnItem
    {
        return DB::transaction(function () use ($user, $item) {
            $locked = CustomerReturnItem::query()->lockForUpdate()->findOrFail($item->id);

            if (! $locked->isWaitingForSupplier()) {
                throw ValidationException::withMessages([
                    'supplier_status' => 'This return is not waiting for the company.',
                ]);
            }

            $locked->update([
                'supplier_status' => CustomerReturn::SUPPLIER_GIVEN,
                'given_by' => $user->id,
                'given_at' => now(),
            ]);

            return $locked->fresh(['returnedProduct', 'supplier', 'customerReturn.user', 'givenBy']) ?? $locked;
        });
    }

    public function lastSupplierId(int $productId): ?int
    {
        $id = PurchaseItem::query()
            ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
            ->where('purchase_items.product_id', $productId)
            ->where('purchases.status', Purchase::STATUS_RECEIVED)
            ->orderByDesc('purchase_items.id')
            ->value('purchases.supplier_id');

        return $id === null ? null : (int) $id;
    }

    /**
     * @param  array<string, mixed>  $item
     * @param  array<int, Product>  $locked
     * @return array{
     *     action: string,
     *     condition: string,
     *     returned: Product,
     *     returned_qty: float,
     *     returned_price: float,
     *     returned_value: float,
     *     replacement: Product|null,
     *     replacement_qty: float|null,
     *     replacement_price: float|null,
     *     replacement_value: float,
     *     supplier_id: int|null,
     *     supplier_status: string
     * }
     */
    private function parseItem(array $item, int $index, array $locked): array
    {
        $action = $item['action'] ?? '';
        $condition = $item['condition'] ?? '';
        $returnedQty = round((float) ($item['returned_quantity'] ?? 0), 3);
        $field = fn (string $name) => "items.{$index}.{$name}";

        if ($returnedQty <= 0) {
            throw ValidationException::withMessages([
                $field('returned_quantity') => 'Quantity must be greater than zero.',
            ]);
        }

        if (! in_array($action, [CustomerReturn::ACTION_REFUND, CustomerReturn::ACTION_REPLACE], true)) {
            throw ValidationException::withMessages([
                $field('action') => 'Choose refund or replace.',
            ]);
        }

        if (! in_array($condition, [CustomerReturn::CONDITION_SELLABLE, CustomerReturn::CONDITION_DEFECTIVE], true)) {
            throw ValidationException::withMessages([
                $field('condition') => 'Choose if the item is still good.',
            ]);
        }

        $returned = $locked[(int) $item['returned_product_id']];
        $this->assertPieceQuantity($returned, $returnedQty, $field('returned_quantity'));
        $returnedPrice = round((float) $returned->sale_price, 2);
        $returnedValue = round($returnedQty * $returnedPrice, 2);

        $replacement = null;
        $replacementQty = null;
        $replacementPrice = null;
        $replacementValue = 0.0;

        if ($action === CustomerReturn::ACTION_REPLACE) {
            if (empty($item['replacement_product_id'])) {
                throw ValidationException::withMessages([
                    $field('replacement_product_id') => 'Scan the product they take now.',
                ]);
            }

            $replacement = $locked[(int) $item['replacement_product_id']];

            if (! $replacement->is_active) {
                throw ValidationException::withMessages([
                    $field('replacement_product_id') => $replacement->name.' is disabled and cannot be sold.',
                ]);
            }

            $replacementQty = round((float) ($item['replacement_quantity'] ?? 0), 3);

            if ($replacementQty <= 0) {
                throw ValidationException::withMessages([
                    $field('replacement_quantity') => 'Quantity must be greater than zero.',
                ]);
            }

            $this->assertPieceQuantity($replacement, $replacementQty, $field('replacement_quantity'));

            $replacementPrice = round((float) $replacement->sale_price, 2);
            $replacementValue = round($replacementQty * $replacementPrice, 2);
        }

        $supplierId = isset($item['supplier_id']) && $item['supplier_id']
            ? (int) $item['supplier_id']
            : null;
        $supplierStatus = CustomerReturn::SUPPLIER_NONE;

        if ($condition === CustomerReturn::CONDITION_DEFECTIVE) {
            if ($supplierId === null) {
                $supplierId = $this->lastSupplierId($returned->id);
            }

            if ($supplierId === null || ! Supplier::query()->whereKey($supplierId)->exists()) {
                throw ValidationException::withMessages([
                    $field('supplier_id') => 'Choose a supplier.',
                ]);
            }

            $supplierStatus = CustomerReturn::SUPPLIER_WAITING;
        } else {
            $supplierId = null;
        }

        return [
            'action' => $action,
            'condition' => $condition,
            'returned' => $returned,
            'returned_qty' => $returnedQty,
            'returned_price' => $returnedPrice,
            'returned_value' => $returnedValue,
            'replacement' => $replacement,
            'replacement_qty' => $replacementQty,
            'replacement_price' => $replacementPrice,
            'replacement_value' => $replacementValue,
            'supplier_id' => $supplierId,
            'supplier_status' => $supplierStatus,
        ];
    }

    private function assertPieceQuantity(Product $product, float $quantity, string $field): void
    {
        if ($product->unit === Product::UNIT_PIECE && round($quantity, 3) !== round($quantity, 0)) {
            throw ValidationException::withMessages([
                $field => 'This product is sold by the piece. Use a whole number.',
            ]);
        }
    }
}
