<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_reports(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)
            ->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports/Index')
                ->has('summary')
                ->has('sales_by_day')
                ->has('purchases_by_supplier')
                ->has('sessions')
                ->has('movements'));
    }

    public function test_cashier_cannot_view_reports(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($cashier)
            ->get(route('reports.index'))
            ->assertForbidden();
    }

    public function test_credit_sale_shows_as_sale_credit_in_stock_movements(): void
    {
        $owner = User::factory()->owner()->create();
        $product = Product::factory()->create([
            'sale_price' => 8,
            'stock_quantity' => 10,
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

        $this->actingAs($owner)
            ->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports/Index')
                ->where('movements.0.type', 'sale (credit)')
                ->where('movements.0.direction', 'out')
                ->where('movements.1.type', 'sale')
                ->where('movements.1.direction', 'out'));

        $this->actingAs($owner)
            ->get(route('stock.show', $product))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Stock/Show')
                ->where('movements.0.type', 'sale (credit)')
                ->where('movements.0.direction', 'out')
                ->where('movements.1.type', 'sale'));
    }

    public function test_profit_uses_cost_at_sale_not_current_product_cost(): void
    {
        $owner = User::factory()->owner()->create();
        $product = Product::factory()->create([
            'sale_price' => 8,
            'cost_price' => 5,
            'stock_quantity' => 10,
        ]);

        $this->actingAs($owner)
            ->post(route('caisse.open'), ['opening_amount' => 0]);

        $this->actingAs($owner)
            ->post(route('pos.store'), [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
                'amount_paid' => 8,
            ]);

        $product->update(['cost_price' => 1]);

        $this->actingAs($owner)
            ->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports/Index')
                ->where('summary.profit', '3.00'));
    }
}
