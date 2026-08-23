<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockAdjustmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_stock_and_adjust_out(): void
    {
        $owner = User::factory()->owner()->create();
        $product = Product::factory()->create([
            'name' => 'Coca-Cola 1L',
            'stock_quantity' => 10,
        ]);

        $this->actingAs($owner)
            ->get(route('stock.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Stock/Index'));

        $this->actingAs($owner)
            ->from(route('stock.show', $product))
            ->post(route('stock.adjust', $product), [
                'direction' => StockMovement::DIRECTION_OUT,
                'quantity' => 1,
                'reason' => 'Broke a bottle',
            ])
            ->assertRedirect(route('stock.show', $product));

        $this->assertSame('9.000', $product->refresh()->stock_quantity);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovement::TYPE_ADJUSTMENT,
            'direction' => StockMovement::DIRECTION_OUT,
            'quantity' => '1.000',
            'reason' => 'Broke a bottle',
        ]);
    }

    public function test_adjust_out_refuses_more_than_stock(): void
    {
        $owner = User::factory()->owner()->create();
        $product = Product::factory()->create(['stock_quantity' => 1]);

        $this->actingAs($owner)
            ->from(route('stock.show', $product))
            ->post(route('stock.adjust', $product), [
                'direction' => StockMovement::DIRECTION_OUT,
                'quantity' => 3,
                'reason' => 'Count correction',
            ])
            ->assertRedirect(route('stock.show', $product))
            ->assertSessionHasErrors('quantity');

        $this->assertSame('1.000', $product->refresh()->stock_quantity);
    }

    public function test_cashier_cannot_view_or_adjust_stock(): void
    {
        $cashier = User::factory()->cashier()->create();
        $product = Product::factory()->create(['stock_quantity' => 5]);

        $this->actingAs($cashier)
            ->get(route('stock.index'))
            ->assertForbidden();

        $this->actingAs($cashier)
            ->post(route('stock.adjust', $product), [
                'direction' => StockMovement::DIRECTION_OUT,
                'quantity' => 1,
                'reason' => 'Damage',
            ])
            ->assertForbidden();
    }
}
