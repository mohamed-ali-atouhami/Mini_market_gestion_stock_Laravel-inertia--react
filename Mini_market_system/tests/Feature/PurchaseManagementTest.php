<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use App\Services\PurchaseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PurchaseManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_purchases(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)
            ->get(route('purchases.index'))
            ->assertOk();
    }

    public function test_create_delivery_page_includes_products_to_tap(): void
    {
        $owner = User::factory()->owner()->create();
        $product = Product::factory()->create([
            'name' => 'Coca-Cola 1L',
            'cost_price' => 5.50,
            'is_active' => true,
        ]);

        $this->actingAs($owner)
            ->get(route('purchases.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Purchases/Create')
                ->has('products', 1)
                ->where('products.0.id', $product->id)
                ->where('products.0.cost_price', '5.5')
                ->where('products.0.stock_quantity', '0')
                ->where('products.0.min_stock', '6')
                ->has('suppliers')
                ->has('categories'));
    }

    public function test_owner_can_look_up_a_product_by_id_on_the_delivery_till(): void
    {
        $owner = User::factory()->owner()->create();
        $product = Product::factory()->create([
            'name' => 'Coca-Cola 1L',
            'cost_price' => 5.50,
        ]);

        $this->actingAs($owner)
            ->get(route('purchases.lookup-product', ['product_id' => $product->id]))
            ->assertOk()
            ->assertJsonPath('product.id', $product->id)
            ->assertJsonPath('product.cost_price', '5.5');
    }

    public function test_cashier_cannot_view_or_receive_purchases(): void
    {
        $cashier = User::factory()->cashier()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($cashier)
            ->get(route('purchases.index'))
            ->assertForbidden();

        $this->actingAs($cashier)
            ->post(route('purchases.store'), $this->deliveryPayload($supplier, $product, receive: true))
            ->assertForbidden();
    }

    public function test_owner_can_receive_twelve_coca_cola_and_stock_goes_from_zero_to_twelve(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Coca-Cola 1L',
            'stock_quantity' => 0,
            'cost_price' => 5.50,
        ]);

        $this->actingAs($owner)
            ->post(route('purchases.store'), $this->deliveryPayload($supplier, $product, 12, 5.50, receive: true))
            ->assertRedirect(route('purchases.index'));

        $this->assertSame('12.000', $product->refresh()->stock_quantity);

        $purchase = Purchase::query()->first();
        $this->assertNotNull($purchase);
        $this->assertSame(Purchase::STATUS_RECEIVED, $purchase->status);
        $this->assertSame('66.00', $purchase->total);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'user_id' => $owner->id,
            'type' => StockMovement::TYPE_PURCHASE,
            'direction' => StockMovement::DIRECTION_IN,
            'quantity' => '12.000',
            'quantity_before' => '0.000',
            'quantity_after' => '12.000',
            'reference_type' => 'Purchase',
            'reference_id' => $purchase->id,
            'reason' => StockMovement::TYPE_PURCHASE,
        ]);
    }

    public function test_saving_a_draft_does_not_change_stock(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create(['stock_quantity' => 0]);

        $this->actingAs($owner)
            ->post(route('purchases.store'), $this->deliveryPayload($supplier, $product, receive: false))
            ->assertRedirect(route('purchases.index'));

        $this->assertSame('0.000', $product->refresh()->stock_quantity);
        $this->assertDatabaseCount('stock_movements', 0);
        $this->assertDatabaseHas('purchases', [
            'status' => Purchase::STATUS_DRAFT,
        ]);
    }

    public function test_reopening_a_draft_shows_quantity_six_not_six_thousand(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($owner)
            ->post(route('purchases.store'), $this->deliveryPayload($supplier, $product, 6, 5.5, receive: false))
            ->assertRedirect(route('purchases.index'));

        $purchase = Purchase::query()->firstOrFail();

        $this->actingAs($owner)
            ->get(route('purchases.edit', $purchase))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Purchases/Edit')
                ->where('purchase.items.0.quantity', '6')
                ->where('purchase.items.0.unit_cost', '5.5'));
    }

    public function test_draft_keeps_a_disabled_supplier_in_the_form(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create(['name' => 'Old Depot', 'is_active' => true]);
        $product = Product::factory()->create();

        $this->actingAs($owner)
            ->post(route('purchases.store'), $this->deliveryPayload($supplier, $product, receive: false));

        $supplier->update(['is_active' => false]);
        $purchase = Purchase::query()->firstOrFail();

        $this->actingAs($owner)
            ->get(route('purchases.edit', $purchase))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Purchases/Edit')
                ->where('purchase.supplier_id', $supplier->id)
                ->has('suppliers', 1)
                ->where('suppliers.0.id', $supplier->id));
    }

    public function test_received_delivery_cannot_be_received_again(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create(['stock_quantity' => 0]);

        $this->actingAs($owner)
            ->post(route('purchases.store'), $this->deliveryPayload($supplier, $product, receive: true));

        $purchase = Purchase::query()->firstOrFail();

        $this->actingAs($owner)
            ->post(route('purchases.receive', $purchase))
            ->assertForbidden();

        $this->assertSame('12.000', $product->refresh()->stock_quantity);
        $this->assertDatabaseCount('stock_movements', 1);
    }

    public function test_empty_draft_cannot_be_received(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
        $purchase = Purchase::query()->create([
            'reference' => Purchase::nextReference(),
            'supplier_id' => $supplier->id,
            'user_id' => $owner->id,
            'status' => Purchase::STATUS_DRAFT,
            'purchase_date' => now()->toDateString(),
            'total' => 0,
        ]);

        $this->actingAs($owner)
            ->from(route('purchases.edit', $purchase))
            ->post(route('purchases.receive', $purchase))
            ->assertRedirect(route('purchases.edit', $purchase))
            ->assertSessionHasErrors('items');

        $this->assertSame(Purchase::STATUS_DRAFT, $purchase->refresh()->status);
    }

    public function test_owner_can_cancel_a_draft_without_changing_stock(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create(['stock_quantity' => 4]);

        $this->actingAs($owner)
            ->post(route('purchases.store'), $this->deliveryPayload($supplier, $product, receive: false));

        $purchase = Purchase::query()->firstOrFail();

        $this->actingAs($owner)
            ->post(route('purchases.cancel', $purchase))
            ->assertRedirect(route('purchases.index'));

        $this->assertSame(Purchase::STATUS_CANCELLED, $purchase->refresh()->status);
        $this->assertSame('4.000', $product->refresh()->stock_quantity);
        $this->assertDatabaseCount('stock_movements', 0);
    }

    public function test_stale_draft_cannot_overwrite_a_received_delivery(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create([
            'stock_quantity' => 0,
            'cost_price' => 5.50,
        ]);

        $this->actingAs($owner)
            ->post(route('purchases.store'), $this->deliveryPayload($supplier, $product, receive: false));

        $stale = Purchase::query()->firstOrFail();

        app(PurchaseService::class)->receive($stale, $owner);

        $this->assertSame(Purchase::STATUS_RECEIVED, $stale->refresh()->status);
        $this->assertSame('12.000', $product->refresh()->stock_quantity);

        $stale->status = Purchase::STATUS_DRAFT;

        try {
            app(PurchaseService::class)->saveDraft(
                $this->deliveryPayload($supplier, $product, 1, 1),
                $owner,
                $stale,
            );
            $this->fail('A received delivery must not be saved as a draft.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('status', $exception->errors());
        }

        $this->assertSame(Purchase::STATUS_RECEIVED, $stale->refresh()->status);
        $this->assertSame('12.000', $product->refresh()->stock_quantity);
        $this->assertSame('66.00', $stale->total);
    }

    public function test_stale_draft_cannot_cancel_a_received_delivery(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create(['stock_quantity' => 0]);

        $this->actingAs($owner)
            ->post(route('purchases.store'), $this->deliveryPayload($supplier, $product, receive: false));

        $stale = Purchase::query()->firstOrFail();

        app(PurchaseService::class)->receive($stale, $owner);

        $stale->status = Purchase::STATUS_DRAFT;

        try {
            app(PurchaseService::class)->cancel($stale);
            $this->fail('A received delivery must not be cancelled.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('status', $exception->errors());
        }

        $this->assertSame(Purchase::STATUS_RECEIVED, $stale->refresh()->status);
        $this->assertSame('12.000', $product->refresh()->stock_quantity);
    }

    public function test_owner_can_look_up_a_product_by_barcode(): void
    {
        $owner = User::factory()->owner()->create();
        $product = Product::factory()->create([
            'name' => 'Coca-Cola 1L',
            'barcode' => '5449000000996',
        ]);

        $this->actingAs($owner)
            ->get(route('purchases.lookup-product', ['barcode' => '5449000000996']))
            ->assertOk()
            ->assertJsonPath('product.id', $product->id)
            ->assertJsonPath('product.name', 'Coca-Cola 1L');
    }

    public function test_unknown_barcode_lookup_returns_not_found(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)
            ->get(route('purchases.lookup-product', ['barcode' => '0000000000000']))
            ->assertNotFound();
    }

    public function test_inactive_product_is_not_found_on_purchase_lookup(): void
    {
        $owner = User::factory()->owner()->create();
        Product::factory()->create([
            'barcode' => '5449000000888',
            'is_active' => false,
        ]);

        $this->actingAs($owner)
            ->get(route('purchases.lookup-product', ['barcode' => '5449000000888']))
            ->assertNotFound();
    }

    public function test_receiving_a_delivery_updates_weighted_average_cost(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create([
            'stock_quantity' => 10,
            'cost_price' => 5,
        ]);

        $this->actingAs($owner)
            ->post(route('purchases.store'), $this->deliveryPayload($supplier, $product, 10, 7, receive: true))
            ->assertRedirect(route('purchases.index'));

        $this->assertSame('20.000', $product->refresh()->stock_quantity);
        $this->assertSame('6.00', $product->cost_price);
    }

    public function test_receiving_a_disabled_product_is_refused(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create([
            'is_active' => false,
            'stock_quantity' => 0,
        ]);

        $this->actingAs($owner)
            ->from(route('purchases.create'))
            ->post(route('purchases.store'), $this->deliveryPayload($supplier, $product, 12, 5.50, receive: true))
            ->assertRedirect(route('purchases.create'))
            ->assertSessionHasErrors('items');

        $this->assertSame('0.000', $product->refresh()->stock_quantity);
        $this->assertSame(0, Purchase::query()->count());
    }

    public function test_receiving_a_draft_with_a_disabled_product_is_refused(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create([
            'stock_quantity' => 0,
        ]);

        $this->actingAs($owner)
            ->post(route('purchases.store'), $this->deliveryPayload($supplier, $product));

        $purchase = Purchase::query()->firstOrFail();
        $product->update(['is_active' => false]);

        $this->actingAs($owner)
            ->from(route('purchases.edit', $purchase))
            ->post(route('purchases.receive', $purchase))
            ->assertRedirect(route('purchases.edit', $purchase))
            ->assertSessionHasErrors('items');

        $this->assertSame(Purchase::STATUS_DRAFT, $purchase->refresh()->status);
        $this->assertSame('0.000', $product->refresh()->stock_quantity);
    }

    public function test_creating_a_product_from_purchases_does_not_set_starting_stock(): void
    {
        $owner = User::factory()->owner()->create();
        $category = Category::factory()->create();

        $this->actingAs($owner)
            ->from(route('purchases.create'))
            ->post(route('products.store'), [
                'name' => 'Sprite 1L',
                'category_id' => $category->id,
                'barcode' => '5449000012345',
                'cost_price' => 5,
                'sale_price' => 8,
                'stock_quantity' => 99,
                'min_stock' => 6,
                'unit' => Product::UNIT_PIECE,
                'is_active' => 1,
                'return_to' => 'purchases',
            ])
            ->assertRedirect(route('purchases.create'))
            ->assertSessionHas('created_product');

        $this->assertDatabaseHas('products', [
            'name' => 'Sprite 1L',
            'barcode' => '5449000012345',
            'stock_quantity' => 0,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function deliveryPayload(
        Supplier $supplier,
        Product $product,
        float|int $quantity = 12,
        float|int $unitCost = 5.5,
        bool $receive = false,
    ): array {
        return [
            'supplier_id' => $supplier->id,
            'purchase_date' => now()->toDateString(),
            'invoice_number' => 'INV-1',
            'notes' => null,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                ],
            ],
            'receive' => $receive,
        ];
    }
}
