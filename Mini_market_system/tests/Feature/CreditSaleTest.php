<?php

namespace Tests\Feature;

use App\Models\CashSession;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreditSaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_take_goods_paying_nothing_now(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'sale_price' => 8,
            'stock_quantity' => 10,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 200]);

        $this->actingAs($cashier)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 5],
                ],
                'payment_method' => 'credit',
                'customer_name' => 'Karim',
                'customer_phone' => '0612345678',
                'due_date' => now()->addDay()->toDateString(),
            ])
            ->assertRedirect();

        $sale = Sale::query()->first();
        $this->assertNotNull($sale);
        $this->assertSame(Sale::PAYMENT_CREDIT, $sale->payment_method);
        $this->assertSame('40.00', $sale->total);
        $this->assertSame('0.00', $sale->amount_paid);
        $this->assertSame('0.00', $sale->change_amount);
        $this->assertSame('40.00', $sale->remaining_amount);
        $this->assertSame('5.000', $product->refresh()->stock_quantity);
        $this->assertDatabaseHas('customers', [
            'name' => 'Karim',
            'phone_normalized' => '212612345678',
        ]);
    }

    public function test_customer_can_pay_part_at_sale(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'sale_price' => 8,
            'stock_quantity' => 10,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 200]);

        $this->actingAs($cashier)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 5],
                ],
                'payment_method' => 'credit',
                'amount_paid' => 15,
                'customer_name' => 'Karim',
                'customer_phone' => '0612345678',
                'due_date' => now()->addDay()->toDateString(),
            ])
            ->assertRedirect();

        $sale = Sale::query()->firstOrFail();
        $this->assertSame('15.00', $sale->amount_paid);
        $this->assertSame('25.00', $sale->remaining_amount);
        $this->assertSame('0.00', $sale->change_amount);
    }

    public function test_credit_that_covers_the_total_is_refused(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'sale_price' => 8,
            'stock_quantity' => 10,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($cashier)
            ->from(route('pos.index'))
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'payment_method' => 'credit',
                'amount_paid' => 8,
                'customer_name' => 'Karim',
                'customer_phone' => '0612345678',
                'due_date' => now()->addDay()->toDateString(),
            ])
            ->assertRedirect(route('pos.index'))
            ->assertSessionHasErrors('amount_paid');

        $this->assertDatabaseCount('sales', 0);
        $this->assertSame('10.000', $product->refresh()->stock_quantity);
    }

    public function test_cashier_can_collect_credit_opened_by_owner(): void
    {
        $owner = User::factory()->owner()->create();
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'sale_price' => 40,
            'stock_quantity' => 5,
        ]);

        $this->actingAs($owner)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($owner)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'payment_method' => 'credit',
                'amount_paid' => 0,
                'customer_name' => 'Karim',
                'customer_phone' => '0612345678',
                'due_date' => now()->toDateString(),
            ]);

        $sale = Sale::query()->firstOrFail();

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 50]);

        $this->actingAs($cashier)
            ->post(route('credits.pay', $sale), ['amount' => 40])
            ->assertRedirect(route('credits.index'));

        $this->assertSame('0.00', $sale->refresh()->remaining_amount);
        $this->assertDatabaseHas('credit_payments', [
            'sale_id' => $sale->id,
            'user_id' => $cashier->id,
            'amount' => '40.00',
        ]);

        $cashierSession = CashSession::query()
            ->where('user_id', $cashier->id)
            ->firstOrFail();

        $this->assertSame(40.0, $cashierSession->cashInDrawer());
    }

    public function test_unpaid_credit_does_not_inflate_caisse_expected(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'sale_price' => 40,
            'stock_quantity' => 5,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 200]);

        $this->actingAs($cashier)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'payment_method' => 'credit',
                'amount_paid' => 0,
                'customer_name' => 'Karim',
                'customer_phone' => '0612345678',
                'due_date' => now()->addDay()->toDateString(),
            ]);

        $session = CashSession::query()->firstOrFail();

        $this->actingAs($cashier)
            ->post(route('caisse.close', $session), ['closing_amount' => 200])
            ->assertRedirect(route('caisse.index'));

        $session->refresh();
        $this->assertSame('200.00', $session->expected_amount);
        $this->assertSame('0.00', $session->difference);
    }

    public function test_partial_credit_at_sale_counts_in_caisse(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'sale_price' => 40,
            'stock_quantity' => 5,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 200]);

        $this->actingAs($cashier)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'payment_method' => 'credit',
                'amount_paid' => 10,
                'customer_name' => 'Karim',
                'customer_phone' => '0612345678',
                'due_date' => now()->addDay()->toDateString(),
            ]);

        $session = CashSession::query()->firstOrFail();
        $this->assertSame(10.0, $session->cashInDrawer());
    }

    public function test_dashboard_lists_credits_due_tomorrow_not_later(): void
    {
        $owner = User::factory()->owner()->create();
        $product = Product::factory()->create([
            'sale_price' => 40,
            'stock_quantity' => 10,
        ]);

        $this->actingAs($owner)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($owner)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'payment_method' => 'credit',
                'amount_paid' => 0,
                'customer_name' => 'Tomorrow',
                'customer_phone' => '0611111111',
                'due_date' => now()->addDay()->toDateString(),
            ]);

        $this->actingAs($owner)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'payment_method' => 'credit',
                'amount_paid' => 0,
                'customer_name' => 'Later',
                'customer_phone' => '0622222222',
                'due_date' => now()->addDays(5)->toDateString(),
            ]);

        $this->actingAs($owner)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->has('due_credits', 1)
                ->where('due_credits.0.customer', 'Tomorrow')
                ->where('due_credits.0.remaining', '40.00'));
    }

    public function test_cashier_sees_all_open_credits_and_whatsapp_link(): void
    {
        $owner = User::factory()->owner()->create();
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'sale_price' => 40,
            'stock_quantity' => 5,
        ]);

        $this->actingAs($owner)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($owner)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'payment_method' => 'credit',
                'amount_paid' => 0,
                'customer_name' => 'Karim',
                'customer_phone' => '0612345678',
                'due_date' => now()->addDays(3)->toDateString(),
            ]);

        $this->actingAs($cashier)
            ->get(route('credits.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Credits/Index')
                ->has('credits', 1)
                ->where('credits.0.customer', 'Karim')
                ->where('credits.0.cashier', $owner->name)
                ->where('credits.0.whatsapp_url', fn ($url) => is_string($url)
                    && str_contains($url, 'https://wa.me/212612345678')
                    && str_contains($url, '40.00')));
    }

    public function test_collecting_credit_requires_open_caisse(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'sale_price' => 40,
            'stock_quantity' => 5,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($cashier)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'payment_method' => 'credit',
                'amount_paid' => 0,
                'customer_name' => 'Karim',
                'customer_phone' => '0612345678',
                'due_date' => now()->toDateString(),
            ]);

        $sale = Sale::query()->firstOrFail();
        $session = CashSession::query()->firstOrFail();

        $this->actingAs($cashier)
            ->post(route('caisse.close', $session), ['closing_amount' => 0]);

        $this->actingAs($cashier)
            ->from(route('credits.index'))
            ->post(route('credits.pay', $sale), ['amount' => 40])
            ->assertRedirect(route('credits.index'))
            ->assertSessionHasErrors('cash_session');

        $this->assertSame('40.00', $sale->refresh()->remaining_amount);
        $this->assertDatabaseCount('credit_payments', 0);
    }

    public function test_cash_sale_without_amount_paid_is_rejected(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'sale_price' => 8,
            'stock_quantity' => 10,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($cashier)
            ->from(route('pos.index'))
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'payment_method' => 'cash',
            ])
            ->assertRedirect(route('pos.index'))
            ->assertSessionHasErrors('amount_paid');

        $this->assertDatabaseCount('sales', 0);
    }

    public function test_receipt_after_collection_shows_paid_so_far(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'sale_price' => 40,
            'stock_quantity' => 5,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($cashier)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'payment_method' => 'credit',
                'amount_paid' => 0,
                'customer_name' => 'Karim',
                'customer_phone' => '0612345678',
                'due_date' => now()->toDateString(),
            ]);

        $sale = Sale::query()->firstOrFail();

        $this->actingAs($cashier)
            ->post(route('credits.pay', $sale), ['amount' => 40]);

        $this->actingAs($cashier)
            ->get(route('sales.receipt', $sale))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Sales/Receipt')
                ->where('sale.payment_method', 'credit')
                ->where('sale.amount_paid', '0.00')
                ->where('sale.paid_so_far', '40.00')
                ->where('sale.remaining', '0.00'));
    }

    public function test_phone_without_leading_zero_reuses_the_same_customer(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'sale_price' => 8,
            'stock_quantity' => 10,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($cashier)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'payment_method' => 'credit',
                'customer_name' => 'Karim',
                'customer_phone' => '0612345678',
                'due_date' => now()->addDay()->toDateString(),
            ])
            ->assertRedirect();

        $this->actingAs($cashier)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'payment_method' => 'credit',
                'customer_name' => 'Karim Bennani',
                'customer_phone' => '612345678',
                'due_date' => now()->addDay()->toDateString(),
            ])
            ->assertRedirect();

        $this->assertSame(1, Customer::query()->count());
        $this->assertDatabaseHas('customers', [
            'name' => 'Karim Bennani',
            'phone_normalized' => '212612345678',
        ]);
        $this->assertSame(2, Sale::query()->where('customer_id', Customer::query()->value('id'))->count());
    }
}
