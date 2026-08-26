<?php

namespace Tests\Feature;

use App\Models\CashSession;
use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosSaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_pos_redirects_when_caisse_is_closed(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($cashier)
            ->get(route('pos.index'))
            ->assertRedirect(route('caisse.index'));
    }

    public function test_cashier_can_open_and_cannot_open_twice(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 200])
            ->assertRedirect(route('caisse.index'));

        $this->assertDatabaseHas('cash_sessions', [
            'user_id' => $cashier->id,
            'status' => CashSession::STATUS_OPEN,
            'opening_amount' => 200,
        ]);

        $this->actingAs($cashier)
            ->from(route('caisse.index'))
            ->post(route('caisse.open'), ['opening_amount' => 50])
            ->assertRedirect(route('caisse.index'))
            ->assertSessionHasErrors('opening_amount');
    }

    public function test_cashier_cannot_view_sales_list(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($cashier)
            ->get(route('sales.index'))
            ->assertForbidden();
    }

    public function test_sell_two_one_litre_and_one_two_litre_pay_fifty(): void
    {
        $cashier = User::factory()->cashier()->create();
        $oneLitre = Product::factory()->create([
            'name' => 'Coca-Cola 1L',
            'barcode' => '6110000000017',
            'sale_price' => 8,
            'stock_quantity' => 12,
        ]);
        $twoLitre = Product::factory()->create([
            'name' => 'Coca-Cola 2L',
            'barcode' => '6110000000024',
            'sale_price' => 13,
            'stock_quantity' => 8,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 200]);

        $this->actingAs($cashier)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $oneLitre->id, 'quantity' => 2],
                    ['product_id' => $twoLitre->id, 'quantity' => 1],
                ],
                'amount_paid' => 50,
            ])
            ->assertRedirect();

        $sale = Sale::query()->first();
        $this->assertNotNull($sale);
        $this->assertSame(Sale::STATUS_COMPLETED, $sale->status);
        $this->assertSame('29.00', $sale->total);
        $this->assertSame('50.00', $sale->amount_paid);
        $this->assertSame('21.00', $sale->change_amount);
        $this->assertSame('10.000', $oneLitre->refresh()->stock_quantity);
        $this->assertSame('7.000', $twoLitre->refresh()->stock_quantity);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $oneLitre->id,
            'type' => StockMovement::TYPE_SALE,
            'direction' => StockMovement::DIRECTION_OUT,
            'quantity' => '2.000',
            'quantity_before' => '12.000',
            'quantity_after' => '10.000',
            'reference_type' => 'Sale',
            'reference_id' => $sale->id,
        ]);
    }

    public function test_sale_is_refused_when_stock_is_not_enough(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'sale_price' => 8,
            'stock_quantity' => 1,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($cashier)
            ->from(route('pos.index'))
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 2],
                ],
                'amount_paid' => 20,
            ])
            ->assertRedirect(route('pos.index'))
            ->assertSessionHasErrors('items');

        $this->assertSame('1.000', $product->refresh()->stock_quantity);
        $this->assertDatabaseCount('sales', 0);
    }

    public function test_pos_lists_active_products_for_the_grid(): void
    {
        $cashier = User::factory()->cashier()->create();
        $flour = Product::factory()->create([
            'name' => 'Farine',
            'barcode' => null,
            'sale_price' => 8,
            'stock_quantity' => 10,
            'unit' => Product::UNIT_KG,
        ]);
        Product::factory()->create([
            'name' => 'Bonbon hidden',
            'barcode' => null,
            'is_active' => false,
        ]);
        $coke = Product::factory()->create([
            'name' => 'Coca-Cola 1L',
            'barcode' => '6110000000017',
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($cashier)
            ->get(route('pos.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Pos/Index')
                ->has('products', 2)
                ->has('categories')
                ->where('products.0.id', $flour->id)
                ->where('products.0.barcode', null)
                ->where('products.0.unit', Product::UNIT_KG)
                ->where('products.1.id', $coke->id));
    }

    public function test_pos_categories_only_include_active_ones_with_active_products(): void
    {
        $cashier = User::factory()->cashier()->create();
        $bakery = Category::factory()->create(['name' => 'Bakery']);
        $empty = Category::factory()->create(['name' => 'Empty']);
        $inactive = Category::factory()->create([
            'name' => 'Old',
            'is_active' => false,
        ]);

        Product::factory()->create([
            'name' => 'Pain',
            'category_id' => $bakery->id,
            'stock_quantity' => 1,
        ]);
        Product::factory()->create([
            'name' => 'Ghost',
            'category_id' => $empty->id,
            'is_active' => false,
        ]);
        Product::factory()->create([
            'name' => 'Old bread',
            'category_id' => $inactive->id,
            'stock_quantity' => 1,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($cashier)
            ->get(route('pos.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Pos/Index')
                ->has('categories', 1)
                ->where('categories.0.id', $bakery->id)
                ->where('categories.0.name', 'Bakery'));
    }

    public function test_pos_lookup_by_product_id_returns_live_stock(): void
    {
        $cashier = User::factory()->cashier()->create();
        $flour = Product::factory()->create([
            'name' => 'Farine',
            'barcode' => null,
            'sale_price' => 5,
            'stock_quantity' => 10,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($cashier)
            ->get(route('pos.lookup-product', ['product_id' => $flour->id]))
            ->assertOk()
            ->assertJsonPath('product.id', $flour->id)
            ->assertJsonPath('product.name', 'Farine')
            ->assertJsonPath('product.stock_quantity', '10');

        $flour->update(['stock_quantity' => 2]);

        $this->actingAs($cashier)
            ->get(route('pos.lookup-product', ['product_id' => $flour->id]))
            ->assertOk()
            ->assertJsonPath('product.stock_quantity', '2');
    }

    public function test_inactive_product_is_not_found_on_pos_id_lookup(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create([
            'barcode' => null,
            'is_active' => false,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($cashier)
            ->get(route('pos.lookup-product', ['product_id' => $product->id]))
            ->assertNotFound();
    }

    public function test_inactive_product_is_not_found_on_pos_lookup(): void
    {
        $cashier = User::factory()->cashier()->create();
        Product::factory()->create([
            'barcode' => '6110000000999',
            'is_active' => false,
        ]);

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($cashier)
            ->get(route('pos.lookup-product', ['barcode' => '6110000000999']))
            ->assertNotFound();
    }

    public function test_close_caisse_stores_expected_and_difference(): void
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
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'amount_paid' => 8,
            ]);

        $session = CashSession::query()->firstOrFail();

        $this->actingAs($cashier)
            ->post(route('caisse.close', $session), ['closing_amount' => 209])
            ->assertRedirect(route('caisse.index'));

        $session->refresh();
        $this->assertSame(CashSession::STATUS_CLOSED, $session->status);
        $this->assertSame('208.00', $session->expected_amount);
        $this->assertSame('1.00', $session->difference);
    }

    public function test_owner_can_view_sales_list_after_a_sale(): void
    {
        $owner = User::factory()->owner()->create();
        $product = Product::factory()->create([
            'sale_price' => 8,
            'stock_quantity' => 5,
        ]);

        $this->actingAs($owner)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($owner)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'amount_paid' => 10,
            ]);

        $this->actingAs($owner)
            ->get(route('sales.index'))
            ->assertOk();
    }

    public function test_duplicate_pos_lines_for_the_same_product_are_merged(): void
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
                    ['product_id' => $product->id, 'quantity' => 2],
                ],
                'amount_paid' => 24,
            ])
            ->assertRedirect();

        $sale = Sale::query()->firstOrFail();
        $this->assertSame('24.00', $sale->total);
        $this->assertSame(1, $sale->items()->count());
        $this->assertSame('3.000', $sale->items()->first()?->quantity);
        $this->assertSame('7.000', $product->refresh()->stock_quantity);
    }
}
