<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Setting;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ShopSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_shop_tables_exist(): void
    {
        foreach ([
            'categories',
            'suppliers',
            'products',
            'purchases',
            'purchase_items',
            'cash_sessions',
            'sales',
            'sale_items',
            'credit_payments',
            'customer_returns',
            'customer_return_items',
            'stock_movements',
            'settings',
        ] as $table) {
            $this->assertTrue(Schema::hasTable($table), "Missing table: {$table}");
        }

        $this->assertTrue(Schema::hasColumn('products', 'image_path'));
    }

    public function test_app_clock_is_morocco(): void
    {
        $this->assertSame('Africa/Casablanca', config('app.timezone'));
        $this->assertSame('Africa/Casablanca', now()->timezoneName);
    }

    public function test_seed_creates_demo_shop_data(): void
    {
        $this->seed();

        $this->assertDatabaseHas('users', ['username' => 'younes', 'is_active' => true]);
        $this->assertDatabaseHas('users', ['username' => 'rabie', 'is_active' => true]);
        $this->assertDatabaseHas('users', ['username' => 'ahmed', 'is_active' => false]);
        $this->assertSame(10, Category::query()->count());
        $this->assertSame(100, Product::query()->count());
        $this->assertDatabaseHas('categories', ['name' => 'Drinks']);
        $this->assertDatabaseHas('suppliers', ['name' => 'Coca-Cola Distribution']);
        $this->assertDatabaseHas('products', [
            'name' => 'Coca-Cola 1L',
            'barcode' => '6110000000017',
        ]);
        $this->assertDatabaseHas('products', [
            'name' => 'Coca-Cola 2L',
            'barcode' => '6110000000024',
        ]);
        $this->assertDatabaseHas('settings', [
            'id' => 1,
            'shop_name' => 'Mini market',
            'currency' => 'MAD',
        ]);

        $coke = Product::query()->where('barcode', '6110000000017')->firstOrFail();
        $this->assertSame('Drinks', $coke->category->name);
        $this->assertSame('0.000', $coke->stock_quantity);
    }

    public function test_purchase_belongs_to_supplier_user_and_items(): void
    {
        $user = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create(['cost_price' => 5.50]);

        $purchase = Purchase::query()->create([
            'reference' => 'PUR-2026-0001',
            'supplier_id' => $supplier->id,
            'user_id' => $user->id,
            'status' => Purchase::STATUS_DRAFT,
            'purchase_date' => now()->toDateString(),
            'total' => 66.00,
        ]);

        $item = PurchaseItem::query()->create([
            'purchase_id' => $purchase->id,
            'product_id' => $product->id,
            'quantity' => 12,
            'unit_cost' => 5.50,
        ]);

        $this->assertTrue($purchase->supplier->is($supplier));
        $this->assertTrue($purchase->user->is($user));
        $this->assertTrue($purchase->items->first()->product->is($product));
        $this->assertSame('66.00', $item->lineTotal());
        $this->assertTrue($user->purchases->contains($purchase));
    }

    public function test_setting_current_returns_the_shop_row(): void
    {
        $this->seed();

        $setting = Setting::current();

        $this->assertSame(1, $setting->id);
        $this->assertSame('MAD', $setting->currency);
    }

    public function test_category_factory_creates_products(): void
    {
        $category = Category::factory()->create(['name' => 'Snacks']);
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Chips',
        ]);

        $this->assertTrue($category->products->contains($product));
        $this->assertTrue($product->isLowStock());
    }
}
