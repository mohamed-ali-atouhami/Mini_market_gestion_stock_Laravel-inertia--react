<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_shows_today_sales_and_low_stock(): void
    {
        $owner = User::factory()->owner()->create();
        $product = Product::factory()->create([
            'name' => 'Coca-Cola 1L',
            'sale_price' => 8,
            'cost_price' => 5.5,
            'stock_quantity' => 12,
            'min_stock' => 12,
        ]);

        $this->actingAs($owner)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($owner)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 2],
                ],
                'amount_paid' => 20,
            ]);

        $this->actingAs($owner)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('today.sales_total', '16.00')
                ->where('today.ticket_count', 1)
                ->where('stock_value', '55.00')
                ->has('low_stock', 1)
                ->where('low_stock.0.name', 'Coca-Cola 1L')
                ->where('low_stock.0.image_url', null)
                ->has('top_selling', 1)
                ->where('top_selling.0.id', $product->id)
                ->where('top_selling.0.name', 'Coca-Cola 1L')
                ->where('top_selling.0.image_url', null)
                ->has('week', 7)
                ->where('week.6.sales', 16)
                ->has('stock_by_category', 1)
                ->where('stock_by_category.0.quantity', '10')
                ->has('recent_purchases', 0));
    }

    public function test_dashboard_shows_received_purchases_and_week_totals(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create(['name' => 'Atlas Boissons']);
        Product::factory()->create([
            'name' => 'Coca-Cola 1L',
            'cost_price' => 5.5,
            'stock_quantity' => 12,
        ]);

        Purchase::query()->create([
            'reference' => 'PUR-2026-0001',
            'supplier_id' => $supplier->id,
            'user_id' => $owner->id,
            'status' => Purchase::STATUS_RECEIVED,
            'purchase_date' => now()->toDateString(),
            'total' => 66,
        ]);

        $this->actingAs($owner)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('week.6.purchases', 66)
                ->has('recent_purchases', 1)
                ->where('recent_purchases.0.reference', 'PUR-2026-0001')
                ->where('recent_purchases.0.supplier', 'Atlas Boissons')
                ->where('recent_purchases.0.total', '66.00')
                ->has('stock_by_category', 1)
                ->where('stock_by_category.0.quantity', '12'));
    }

    public function test_cashier_can_view_dashboard(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($cashier)
            ->get(route('dashboard'))
            ->assertOk();
    }
}
