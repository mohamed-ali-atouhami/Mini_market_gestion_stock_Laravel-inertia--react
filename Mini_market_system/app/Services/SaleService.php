<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\CashSession;
use App\Models\CreditPayment;
use App\Models\Customer;
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
     * @param  array{name: string, phone: string, due_date: string}|null  $credit
     */
    public function checkout(
        User $user,
        array $items,
        float|int|string $amountPaid,
        ?array $credit = null,
    ): Sale {
        return DB::transaction(function () use ($user, $items, $amountPaid, $credit) {
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

            $merged = [];

            foreach ($items as $item) {
                $productId = (int) $item['product_id'];
                $quantity = round((float) $item['quantity'], 3);
                $merged[$productId] = ($merged[$productId] ?? 0) + $quantity;
            }

            $lines = [];
            $total = 0.0;

            foreach ($merged as $productId => $quantity) {
                if ($quantity <= 0) {
                    throw ValidationException::withMessages([
                        'items' => 'Quantity must be greater than zero.',
                    ]);
                }

                $product = Product::query()->lockForUpdate()->findOrFail($productId);

                if (! $product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => $product->name.' is disabled and cannot be sold.',
                    ]);
                }

                $unitPrice = (float) $product->sale_price;
                $unitCost = (float) $product->cost_price;
                $total += $quantity * $unitPrice;
                $lines[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'unit_cost' => $unitCost,
                ];
            }

            $total = round($total, 2);
            $paid = round((float) $amountPaid, 2);
            $isCredit = $credit !== null;

            if ($isCredit) {
                if ($paid >= $total) {
                    throw ValidationException::withMessages([
                        'amount_paid' => 'That covers the total. Use cash pay.',
                    ]);
                }

                if ($paid < 0) {
                    throw ValidationException::withMessages([
                        'amount_paid' => 'Amount paid cannot be negative.',
                    ]);
                }

                $customer = Customer::findOrCreateFromPos($credit['name'], $credit['phone']);
                $change = 0.0;
                $remaining = round($total - $paid, 2);
            } else {
                if ($paid < $total) {
                    throw ValidationException::withMessages([
                        'amount_paid' => 'Amount paid is less than the total.',
                    ]);
                }

                $customer = null;
                $change = round($paid - $total, 2);
                $remaining = 0.0;
            }

            $sale = Sale::query()->create([
                'reference' => Sale::nextReference(),
                'user_id' => $user->id,
                'cash_session_id' => $session->id,
                'customer_id' => $customer?->id,
                'status' => Sale::STATUS_COMPLETED,
                'payment_method' => $isCredit ? Sale::PAYMENT_CREDIT : Sale::PAYMENT_CASH,
                'due_date' => $isCredit ? $credit['due_date'] : null,
                'total' => $total,
                'amount_paid' => $paid,
                'change_amount' => $change,
                'remaining_amount' => $remaining,
            ]);

            foreach ($lines as $line) {
                SaleItem::query()->create([
                    'sale_id' => $sale->id,
                    'product_id' => $line['product']->id,
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'unit_cost' => $line['unit_cost'],
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

            return $sale->fresh(['items.product', 'user', 'customer']) ?? $sale;
        });
    }

    public function collectCredit(User $user, Sale $sale, float|int|string $amount): CreditPayment
    {
        return DB::transaction(function () use ($user, $sale, $amount) {
            $session = CashSession::query()
                ->where('user_id', $user->id)
                ->where('status', CashSession::STATUS_OPEN)
                ->lockForUpdate()
                ->first();

            if ($session === null) {
                throw ValidationException::withMessages([
                    'cash_session' => 'Open the caisse before collecting credit.',
                ]);
            }

            $locked = Sale::query()->lockForUpdate()->findOrFail($sale->id);

            if (! $locked->isCredit() || $locked->status !== Sale::STATUS_COMPLETED) {
                throw ValidationException::withMessages([
                    'amount' => 'This is not an open credit sale.',
                ]);
            }

            $remaining = round((float) $locked->remaining_amount, 2);

            if ($remaining <= 0) {
                throw ValidationException::withMessages([
                    'amount' => 'This credit is already settled.',
                ]);
            }

            $paid = round((float) $amount, 2);

            if ($paid <= 0) {
                throw ValidationException::withMessages([
                    'amount' => 'Enter the amount the customer is paying now.',
                ]);
            }

            if ($paid > $remaining) {
                throw ValidationException::withMessages([
                    'amount' => 'That is more than the remaining '.$remaining.' MAD.',
                ]);
            }

            $payment = CreditPayment::query()->create([
                'sale_id' => $locked->id,
                'user_id' => $user->id,
                'cash_session_id' => $session->id,
                'amount' => $paid,
            ]);

            $locked->update([
                'remaining_amount' => round($remaining - $paid, 2),
            ]);

            return $payment;
        });
    }
}
