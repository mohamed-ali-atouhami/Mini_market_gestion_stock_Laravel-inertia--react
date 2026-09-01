<?php

namespace Tests\Feature;

use App\Models\CashSession;
use App\Models\CustomerReturn;
use App\Models\CustomerReturnItem;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerReturnTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_redirect_when_caisse_is_closed(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($cashier)
            ->get(route('returns.index'))
            ->assertRedirect(route('caisse.index'));
    }

    public function test_cashier_can_open_returns_when_caisse_is_open(): void
    {
        $cashier = User::factory()->cashier()->create();
        $this->openCaisse($cashier);

        $this->actingAs($cashier)
            ->get(route('returns.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Returns/Index')
                ->has('products')
                ->has('waiting'));
    }

    public function test_defective_replace_same_product_drops_stock_and_waits_for_supplier(): void
    {
        $cashier = User::factory()->cashier()->create();
        $supplier = Supplier::factory()->create(['name' => 'Centrale Laitiere']);
        $milk = Product::factory()->create([
            'name' => 'Milk 1L',
            'sale_price' => 8,
            'stock_quantity' => 5,
        ]);
        $this->receivedPurchase($cashier, $supplier, $milk);
        $this->openCaisse($cashier);

        $this->actingAs($cashier)
            ->post(route('returns.store'), [
                'items' => [[
                    'action' => CustomerReturn::ACTION_REPLACE,
                    'condition' => CustomerReturn::CONDITION_DEFECTIVE,
                    'returned_product_id' => $milk->id,
                    'returned_quantity' => 1,
                    'replacement_product_id' => $milk->id,
                    'replacement_quantity' => 1,
                ]],
            ])
            ->assertRedirect(route('returns.index'));

        $row = CustomerReturn::query()->firstOrFail();
        $item = $row->items()->firstOrFail();
        $this->assertSame('0.00', $row->cash_delta);
        $this->assertSame(CustomerReturn::SUPPLIER_WAITING, $item->supplier_status);
        $this->assertSame($supplier->id, $item->supplier_id);
        $this->assertSame('4.000', $milk->refresh()->stock_quantity);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $milk->id,
            'type' => StockMovement::TYPE_RETURN,
            'direction' => StockMovement::DIRECTION_OUT,
            'quantity' => '1.000',
            'reason' => 'replacement for Milk 1L',
            'reference_type' => 'CustomerReturn',
            'reference_id' => $row->id,
        ]);
        $this->assertDatabaseMissing('stock_movements', [
            'product_id' => $milk->id,
            'direction' => StockMovement::DIRECTION_IN,
            'reason' => 'customer return',
        ]);

        $session = CashSession::query()->firstOrFail();
        $this->assertSame(0.0, $session->cashInDrawer());
    }

    public function test_sellable_refund_puts_stock_back_and_lowers_caisse(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'sale_price' => 8,
            'stock_quantity' => 5,
        ]);
        $this->openCaisse($cashier, 200);

        $this->actingAs($cashier)
            ->post(route('returns.store'), [
                'items' => [[
                    'action' => CustomerReturn::ACTION_REFUND,
                    'condition' => CustomerReturn::CONDITION_SELLABLE,
                    'returned_product_id' => $product->id,
                    'returned_quantity' => 1,
                ]],
            ])
            ->assertRedirect(route('returns.index'));

        $row = CustomerReturn::query()->firstOrFail();
        $item = $row->items()->firstOrFail();
        $this->assertSame('-8.00', $row->cash_delta);
        $this->assertSame(CustomerReturn::SUPPLIER_NONE, $item->supplier_status);
        $this->assertNull($item->supplier_id);
        $this->assertSame('6.000', $product->refresh()->stock_quantity);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovement::TYPE_RETURN,
            'direction' => StockMovement::DIRECTION_IN,
            'reason' => 'customer return',
        ]);

        $session = CashSession::query()->firstOrFail();
        $this->assertSame(-8.0, $session->cashInDrawer());

        $this->actingAs($cashier)
            ->post(route('caisse.close', $session), ['closing_amount' => 192])
            ->assertRedirect(route('caisse.index'));

        $session->refresh();
        $this->assertSame('192.00', $session->expected_amount);
        $this->assertSame('0.00', $session->difference);
    }

    public function test_replace_more_expensive_customer_pays_the_difference(): void
    {
        $cashier = User::factory()->cashier()->create();
        $cheap = Product::factory()->create([
            'name' => 'Milk 1L',
            'sale_price' => 8,
            'stock_quantity' => 10,
        ]);
        $dear = Product::factory()->create([
            'name' => 'Milk 2L',
            'sale_price' => 13,
            'stock_quantity' => 10,
        ]);
        $this->openCaisse($cashier);

        $this->actingAs($cashier)
            ->post(route('returns.store'), [
                'items' => [[
                    'action' => CustomerReturn::ACTION_REPLACE,
                    'condition' => CustomerReturn::CONDITION_SELLABLE,
                    'returned_product_id' => $cheap->id,
                    'returned_quantity' => 1,
                    'replacement_product_id' => $dear->id,
                    'replacement_quantity' => 1,
                ]],
                'amount_paid' => 10,
            ])
            ->assertRedirect(route('returns.index'));

        $row = CustomerReturn::query()->firstOrFail();
        $this->assertSame('5.00', $row->cash_delta);
        $this->assertSame('10.00', $row->amount_paid);
        $this->assertSame('5.00', $row->change_amount);
        $this->assertSame('11.000', $cheap->refresh()->stock_quantity);
        $this->assertSame('9.000', $dear->refresh()->stock_quantity);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $dear->id,
            'direction' => StockMovement::DIRECTION_OUT,
            'reason' => 'replacement for Milk 1L',
        ]);

        $session = CashSession::query()->firstOrFail();
        $this->assertSame(5.0, $session->cashInDrawer());
    }

    public function test_replace_cheaper_shop_gives_the_difference(): void
    {
        $cashier = User::factory()->cashier()->create();
        $dear = Product::factory()->create([
            'sale_price' => 13,
            'stock_quantity' => 10,
        ]);
        $cheap = Product::factory()->create([
            'sale_price' => 8,
            'stock_quantity' => 10,
        ]);
        $this->openCaisse($cashier);

        $this->actingAs($cashier)
            ->post(route('returns.store'), [
                'items' => [[
                    'action' => CustomerReturn::ACTION_REPLACE,
                    'condition' => CustomerReturn::CONDITION_SELLABLE,
                    'returned_product_id' => $dear->id,
                    'returned_quantity' => 1,
                    'replacement_product_id' => $cheap->id,
                    'replacement_quantity' => 1,
                ]],
            ])
            ->assertRedirect(route('returns.index'));

        $row = CustomerReturn::query()->firstOrFail();
        $this->assertSame('-5.00', $row->cash_delta);
        $this->assertNull($row->amount_paid);
        $this->assertSame('11.000', $dear->refresh()->stock_quantity);
        $this->assertSame('9.000', $cheap->refresh()->stock_quantity);

        $session = CashSession::query()->firstOrFail();
        $this->assertSame(-5.0, $session->cashInDrawer());
    }

    public function test_defective_replacement_is_refused_when_stock_is_not_enough(): void
    {
        $cashier = User::factory()->cashier()->create();
        $supplier = Supplier::factory()->create();
        $bad = Product::factory()->create([
            'sale_price' => 8,
            'stock_quantity' => 0,
        ]);
        $good = Product::factory()->create([
            'sale_price' => 8,
            'stock_quantity' => 0,
        ]);
        $this->receivedPurchase($cashier, $supplier, $bad);
        $this->openCaisse($cashier);

        $this->actingAs($cashier)
            ->from(route('returns.index'))
            ->post(route('returns.store'), [
                'items' => [[
                    'action' => CustomerReturn::ACTION_REPLACE,
                    'condition' => CustomerReturn::CONDITION_DEFECTIVE,
                    'returned_product_id' => $bad->id,
                    'returned_quantity' => 1,
                    'replacement_product_id' => $good->id,
                    'replacement_quantity' => 1,
                    'supplier_id' => $supplier->id,
                ]],
            ])
            ->assertRedirect(route('returns.index'))
            ->assertSessionHasErrors('items.0.replacement_product_id');

        $this->assertDatabaseCount('customer_returns', 0);
        $this->assertDatabaseCount('customer_return_items', 0);
        $this->assertSame('0.000', $good->refresh()->stock_quantity);
        $this->assertSame('0.000', $bad->refresh()->stock_quantity);
    }

    public function test_give_to_supplier_once_then_refuse_the_second_time(): void
    {
        $cashier = User::factory()->cashier()->create();
        $supplier = Supplier::factory()->create();
        $milk = Product::factory()->create([
            'sale_price' => 8,
            'stock_quantity' => 5,
        ]);
        $this->receivedPurchase($cashier, $supplier, $milk);
        $this->openCaisse($cashier);

        $this->actingAs($cashier)
            ->post(route('returns.store'), [
                'items' => [[
                    'action' => CustomerReturn::ACTION_REFUND,
                    'condition' => CustomerReturn::CONDITION_DEFECTIVE,
                    'returned_product_id' => $milk->id,
                    'returned_quantity' => 1,
                    'supplier_id' => $supplier->id,
                ]],
            ])
            ->assertRedirect(route('returns.index'));

        $item = CustomerReturnItem::query()->firstOrFail();
        $this->assertSame('5.000', $milk->refresh()->stock_quantity);

        $this->actingAs($cashier)
            ->post(route('returns.give', $item))
            ->assertRedirect(route('returns.index'));

        $item->refresh();
        $this->assertSame(CustomerReturn::SUPPLIER_GIVEN, $item->supplier_status);
        $this->assertSame($cashier->id, $item->given_by);
        $this->assertNotNull($item->given_at);

        $this->actingAs($cashier)
            ->from(route('returns.index'))
            ->post(route('returns.give', $item))
            ->assertRedirect(route('returns.index'))
            ->assertSessionHasErrors('supplier_status');
    }

    public function test_replace_more_expensive_requires_amount_paid(): void
    {
        $cashier = User::factory()->cashier()->create();
        $cheap = Product::factory()->create(['sale_price' => 8, 'stock_quantity' => 10]);
        $dear = Product::factory()->create(['sale_price' => 13, 'stock_quantity' => 10]);
        $this->openCaisse($cashier);

        $this->actingAs($cashier)
            ->from(route('returns.index'))
            ->post(route('returns.store'), [
                'items' => [[
                    'action' => CustomerReturn::ACTION_REPLACE,
                    'condition' => CustomerReturn::CONDITION_SELLABLE,
                    'returned_product_id' => $cheap->id,
                    'returned_quantity' => 1,
                    'replacement_product_id' => $dear->id,
                    'replacement_quantity' => 1,
                ]],
            ])
            ->assertRedirect(route('returns.index'))
            ->assertSessionHasErrors('amount_paid');
    }

    public function test_one_confirm_can_refund_and_replace_several_products(): void
    {
        $cashier = User::factory()->cashier()->create();
        $milk = Product::factory()->create([
            'name' => 'Milk 1L',
            'sale_price' => 8,
            'stock_quantity' => 10,
        ]);
        $water = Product::factory()->create([
            'name' => 'Sidi Ali 1.5L',
            'sale_price' => 6,
            'stock_quantity' => 10,
        ]);
        $coke = Product::factory()->create([
            'name' => 'Coca-Cola 1L',
            'sale_price' => 8,
            'stock_quantity' => 10,
        ]);
        $this->openCaisse($cashier);

        $this->actingAs($cashier)
            ->post(route('returns.store'), [
                'items' => [
                    [
                        'action' => CustomerReturn::ACTION_REFUND,
                        'condition' => CustomerReturn::CONDITION_SELLABLE,
                        'returned_product_id' => $milk->id,
                        'returned_quantity' => 1,
                    ],
                    [
                        'action' => CustomerReturn::ACTION_REPLACE,
                        'condition' => CustomerReturn::CONDITION_SELLABLE,
                        'returned_product_id' => $water->id,
                        'returned_quantity' => 1,
                        'replacement_product_id' => $coke->id,
                        'replacement_quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('returns.index'));

        $row = CustomerReturn::query()->firstOrFail();
        $this->assertSame(2, $row->items()->count());
        $this->assertSame('-6.00', $row->cash_delta);
        $this->assertSame('11.000', $milk->refresh()->stock_quantity);
        $this->assertSame('11.000', $water->refresh()->stock_quantity);
        $this->assertSame('9.000', $coke->refresh()->stock_quantity);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $coke->id,
            'direction' => StockMovement::DIRECTION_OUT,
            'reason' => 'replacement for Sidi Ali 1.5L',
        ]);

        $session = CashSession::query()->firstOrFail();
        $this->assertSame(-6.0, $session->cashInDrawer());
    }

    public function test_old_replacement_reason_still_shows_the_returned_product(): void
    {
        $owner = User::factory()->owner()->create();
        $milk = Product::factory()->create([
            'name' => 'Milk 1L',
            'sale_price' => 8,
            'stock_quantity' => 10,
        ]);
        $butter = Product::factory()->create([
            'name' => 'Beurre Centrale 200g',
            'sale_price' => 18,
            'stock_quantity' => 10,
        ]);
        $this->openCaisse($owner);

        $this->actingAs($owner)
            ->post(route('returns.store'), [
                'items' => [[
                    'action' => CustomerReturn::ACTION_REPLACE,
                    'condition' => CustomerReturn::CONDITION_SELLABLE,
                    'returned_product_id' => $milk->id,
                    'returned_quantity' => 1,
                    'replacement_product_id' => $butter->id,
                    'replacement_quantity' => 1,
                ]],
                'amount_paid' => 10,
            ])
            ->assertRedirect(route('returns.index'));

        $movement = StockMovement::query()
            ->where('product_id', $butter->id)
            ->where('direction', StockMovement::DIRECTION_OUT)
            ->firstOrFail();
        $movement->update(['reason' => 'replacement']);

        $this->actingAs($owner)
            ->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports/Index')
                ->where('movements.0.reason', 'replacement for Milk 1L'));

        $this->actingAs($owner)
            ->get(route('stock.show', $butter))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Stock/Show')
                ->where('movements.0.reason', 'replacement for Milk 1L'));
    }

    private function openCaisse(User $user, float $opening = 0): void
    {
        $this->actingAs($user)
            ->post(route('caisse.open'), ['opening_amount' => $opening]);
    }

    private function receivedPurchase(User $user, Supplier $supplier, Product $product): void
    {
        $purchase = Purchase::query()->create([
            'reference' => Purchase::nextReference(),
            'supplier_id' => $supplier->id,
            'user_id' => $user->id,
            'status' => Purchase::STATUS_RECEIVED,
            'purchase_date' => now()->toDateString(),
            'total' => 10,
        ]);

        PurchaseItem::query()->create([
            'purchase_id' => $purchase->id,
            'product_id' => $product->id,
            'quantity' => 10,
            'unit_cost' => 5,
        ]);
    }
}
