<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_products(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)
            ->get(route('products.index'))
            ->assertOk();
    }

    public function test_cashier_cannot_view_or_create_products(): void
    {
        $cashier = User::factory()->cashier()->create();
        $category = Category::factory()->create();

        $this->actingAs($cashier)
            ->get(route('products.index'))
            ->assertForbidden();

        $this->actingAs($cashier)
            ->post(route('products.store'), $this->productPayload($category))
            ->assertForbidden();
    }

    public function test_owner_can_create_a_product_with_barcode_and_prices(): void
    {
        $owner = User::factory()->owner()->create();
        $category = Category::factory()->create(['name' => 'Drinks']);

        $this->actingAs($owner)
            ->post(route('products.store'), $this->productPayload($category, [
                'name' => 'Coca-Cola 1L',
                'barcode' => '5449000000996',
                'cost_price' => 5.50,
                'sale_price' => 8.00,
                'stock_quantity' => 0,
                'min_stock' => 12,
            ]))
            ->assertRedirect(route('products.index'));

        $this->assertDatabaseHas('products', [
            'name' => 'Coca-Cola 1L',
            'barcode' => '5449000000996',
            'category_id' => $category->id,
            'cost_price' => 5.50,
            'sale_price' => 8.00,
            'stock_quantity' => 0,
            'min_stock' => 12,
            'unit' => Product::UNIT_PIECE,
        ]);
    }

    public function test_duplicate_barcode_is_rejected(): void
    {
        $owner = User::factory()->owner()->create();
        $category = Category::factory()->create();
        Product::factory()->create(['barcode' => '6110000000017']);

        $this->actingAs($owner)
            ->from(route('products.index'))
            ->post(route('products.store'), $this->productPayload($category, [
                'barcode' => '6110000000017',
            ]))
            ->assertRedirect(route('products.index'))
            ->assertSessionHasErrors('barcode');
    }

    public function test_empty_barcode_is_stored_as_null(): void
    {
        $owner = User::factory()->owner()->create();
        $category = Category::factory()->create();

        $this->actingAs($owner)
            ->post(route('products.store'), $this->productPayload($category, [
                'barcode' => '   ',
            ]))
            ->assertRedirect(route('products.index'));

        $this->assertDatabaseHas('products', [
            'name' => 'Test product',
            'barcode' => null,
        ]);
    }

    public function test_stock_cannot_be_changed_on_update(): void
    {
        $owner = User::factory()->owner()->create();
        $product = Product::factory()->create([
            'stock_quantity' => 10,
            'name' => 'Coca-Cola 1L',
        ]);

        $this->actingAs($owner)
            ->patch(route('products.update', $product), [
                'name' => $product->name,
                'category_id' => $product->category_id,
                'barcode' => $product->barcode,
                'cost_price' => $product->cost_price,
                'sale_price' => $product->sale_price,
                'stock_quantity' => 99,
                'min_stock' => $product->min_stock,
                'unit' => $product->unit,
                'is_active' => 1,
            ])
            ->assertRedirect(route('products.index'));

        $this->assertSame('10.000', $product->refresh()->stock_quantity);
    }

    public function test_owner_can_search_products_by_barcode(): void
    {
        $owner = User::factory()->owner()->create();
        Product::factory()->create([
            'name' => 'Pepsi 1L',
            'barcode' => '1111111111111',
        ]);
        Product::factory()->create([
            'name' => 'Fanta 1L',
            'barcode' => '2222222222222',
        ]);

        $this->actingAs($owner)
            ->get(route('products.index', ['search' => '1111111111111']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Products/Index')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Pepsi 1L'));
    }

    public function test_product_edit_fields_do_not_pad_decimals(): void
    {
        $owner = User::factory()->owner()->create();
        Product::factory()->create([
            'name' => 'Coca-Cola 1L',
            'cost_price' => 5.50,
            'sale_price' => 8.00,
            'stock_quantity' => 12,
            'min_stock' => 12,
        ]);

        $this->actingAs($owner)
            ->get(route('products.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Products/Index')
                ->where('products.data.0.cost_price', '5.5')
                ->where('products.data.0.sale_price', '8')
                ->where('products.data.0.stock_quantity', '12')
                ->where('products.data.0.min_stock', '12'));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function productPayload(Category $category, array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test product',
            'category_id' => $category->id,
            'barcode' => '6110000099999',
            'cost_price' => 4,
            'sale_price' => 7,
            'stock_quantity' => 0,
            'min_stock' => 6,
            'unit' => Product::UNIT_PIECE,
            'is_active' => 1,
        ], $overrides);
    }
}
