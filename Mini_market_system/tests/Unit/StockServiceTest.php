<?php

namespace Tests\Unit;

use App\Exceptions\InsufficientStockException;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_increase_adds_stock_and_writes_a_movement(): void
    {
        $user = User::factory()->owner()->create();
        $product = Product::factory()->create(['stock_quantity' => 0]);

        $movement = app(StockService::class)->increase(
            $product,
            12,
            $user,
            StockMovement::TYPE_PURCHASE,
        );

        $this->assertSame('12.000', $product->refresh()->stock_quantity);
        $this->assertSame(StockMovement::TYPE_PURCHASE, $movement->type);
        $this->assertSame(StockMovement::DIRECTION_IN, $movement->direction);
        $this->assertSame('0.000', $movement->quantity_before);
        $this->assertSame('12.000', $movement->quantity_after);
    }

    public function test_decrease_removes_stock_when_there_is_enough(): void
    {
        $user = User::factory()->cashier()->create();
        $product = Product::factory()->create(['stock_quantity' => 5]);

        app(StockService::class)->decrease(
            $product,
            2,
            $user,
            StockMovement::TYPE_SALE,
        );

        $this->assertSame('3.000', $product->refresh()->stock_quantity);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovement::TYPE_SALE,
            'direction' => StockMovement::DIRECTION_OUT,
        ]);
    }

    public function test_decrease_refuses_to_go_below_zero(): void
    {
        $user = User::factory()->cashier()->create();
        $product = Product::factory()->create(['stock_quantity' => 2]);

        try {
            app(StockService::class)->decrease(
                $product,
                3,
                $user,
                StockMovement::TYPE_SALE,
            );
            $this->fail('Expected stock to be refused.');
        } catch (InsufficientStockException $exception) {
            $this->assertSame('2.000', $product->refresh()->stock_quantity);
            $this->assertDatabaseCount('stock_movements', 0);
        }
    }

    public function test_adjust_can_add_or_remove_stock(): void
    {
        $user = User::factory()->owner()->create();
        $product = Product::factory()->create(['stock_quantity' => 10]);
        $stock = app(StockService::class);

        $stock->adjust($product, 1, StockMovement::DIRECTION_OUT, $user, 'damage');
        $this->assertSame('9.000', $product->refresh()->stock_quantity);

        $stock->adjust($product, 2, StockMovement::DIRECTION_IN, $user, 'count correction');
        $this->assertSame('11.000', $product->refresh()->stock_quantity);
    }

    public function test_record_return_uses_return_type(): void
    {
        $user = User::factory()->cashier()->create();
        $product = Product::factory()->create(['stock_quantity' => 4]);

        $in = app(StockService::class)->recordReturn(
            $product,
            1,
            $user,
            StockMovement::DIRECTION_IN,
            'customer return',
        );

        $this->assertSame(StockMovement::TYPE_RETURN, $in->type);
        $this->assertSame(StockMovement::DIRECTION_IN, $in->direction);
        $this->assertSame('5.000', $product->refresh()->stock_quantity);
    }
}
