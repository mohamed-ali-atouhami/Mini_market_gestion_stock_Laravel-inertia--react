<?php

namespace Tests\Feature;

use App\Models\CashSession;
use App\Models\CustomerReturn;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Supplier;
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
                ->has('top_products')
                ->has('purchases_by_supplier')
                ->has('caisse_today')
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
                ->where('summary.profit', '3.00')
                ->where('top_products.0.name', $product->name));
    }

    public function test_sellable_refund_removes_the_sale_margin_from_profit(): void
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

        $this->actingAs($owner)
            ->post(route('returns.store'), [
                'items' => [[
                    'action' => CustomerReturn::ACTION_REFUND,
                    'condition' => CustomerReturn::CONDITION_SELLABLE,
                    'returned_product_id' => $product->id,
                    'returned_quantity' => 1,
                ]],
            ])
            ->assertRedirect(route('returns.index'));

        $this->actingAs($owner)
            ->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports/Index')
                ->where('summary.sales_total', '8.00')
                ->where('summary.profit', '0.00'));
    }

    public function test_return_profit_uses_cost_at_return_not_current_product_cost(): void
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

        $this->actingAs($owner)
            ->post(route('returns.store'), [
                'items' => [[
                    'action' => CustomerReturn::ACTION_REFUND,
                    'condition' => CustomerReturn::CONDITION_SELLABLE,
                    'returned_product_id' => $product->id,
                    'returned_quantity' => 1,
                ]],
            ])
            ->assertRedirect(route('returns.index'));

        $product->update(['cost_price' => 1]);

        $this->actingAs($owner)
            ->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports/Index')
                ->where('summary.profit', '0.00'));
    }

    public function test_defective_refund_drops_profit_by_the_lost_goods(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
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

        $this->actingAs($owner)
            ->post(route('returns.store'), [
                'items' => [[
                    'action' => CustomerReturn::ACTION_REFUND,
                    'condition' => CustomerReturn::CONDITION_DEFECTIVE,
                    'returned_product_id' => $product->id,
                    'returned_quantity' => 1,
                    'supplier_id' => $supplier->id,
                ]],
            ])
            ->assertRedirect(route('returns.index'));

        $this->actingAs($owner)
            ->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports/Index')
                ->where('summary.profit', '-5.00'));
    }

    public function test_cashier_cannot_download_the_report_pdf(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($cashier)
            ->get(route('reports.pdf'))
            ->assertForbidden();
    }

    public function test_report_pdf_follows_the_chosen_period(): void
    {
        $owner = User::factory()->owner()->create();
        $today = Product::factory()->create(['name' => 'Today Milk']);
        $within = Product::factory()->create(['name' => 'Week Milk']);
        $later = Product::factory()->create(['name' => 'Later Milk']);
        $nextMonth = Product::factory()->create(['name' => 'December Milk']);

        $this->sellOn($owner, $today, '2026-11-01 11:00:00', 12);
        $this->sellOn($owner, $within, '2026-11-02 11:00:00', 40);
        $this->sellOn($owner, $later, '2026-11-20 11:00:00', 7);
        $this->sellOn($owner, $nextMonth, '2026-12-01 11:00:00', 9);

        $oneDay = $this->actingAs($owner)
            ->get(route('reports.pdf', ['from' => '2026-11-01', 'to' => '2026-11-01']));

        $oneDay->assertOk();
        $oneDay->assertHeader('content-type', 'application/pdf');
        $this->assertStringContainsString(
            'filename="report-2026-11-01.pdf"',
            (string) $oneDay->headers->get('content-disposition'),
        );
        $oneDayBody = $oneDay->getContent();
        $this->assertStringStartsWith('%PDF', $oneDayBody);
        $this->assertStringContainsString('Today Milk', $oneDayBody);
        $this->assertStringContainsString('12.00', $oneDayBody);
        $this->assertStringContainsString('1 Nov 2026', $oneDayBody);
        $this->assertStringNotContainsString('Week Milk', $oneDayBody);
        $this->assertStringNotContainsString('Later Milk', $oneDayBody);
        $this->assertStringNotContainsString('December Milk', $oneDayBody);

        $fifteenDays = $this->actingAs($owner)
            ->get(route('reports.pdf', ['from' => '2026-11-01', 'to' => '2026-11-15']));

        $fifteenDays->assertOk();
        $this->assertStringContainsString(
            'filename="report-2026-11-01-to-2026-11-15.pdf"',
            (string) $fifteenDays->headers->get('content-disposition'),
        );
        $fifteenBody = $fifteenDays->getContent();
        $this->assertStringContainsString('Today Milk', $fifteenBody);
        $this->assertStringContainsString('Week Milk', $fifteenBody);
        $this->assertStringContainsString('52.00', $fifteenBody);
        $this->assertStringNotContainsString('Later Milk', $fifteenBody);
        $this->assertStringNotContainsString('December Milk', $fifteenBody);

        $month = $this->actingAs($owner)
            ->get(route('reports.pdf', ['from' => '2026-11-30', 'to' => '2026-11-01']));

        $month->assertOk();
        $this->assertStringContainsString(
            'filename="report-2026-11-01-to-2026-11-30.pdf"',
            (string) $month->headers->get('content-disposition'),
        );
        $monthBody = $month->getContent();
        $this->assertStringContainsString('Today Milk', $monthBody);
        $this->assertStringContainsString('Week Milk', $monthBody);
        $this->assertStringContainsString('Later Milk', $monthBody);
        $this->assertStringContainsString('59.00', $monthBody);
        $this->assertStringNotContainsString('December Milk', $monthBody);
    }

    private function sellOn(User $user, Product $product, string $at, float $total): void
    {
        $session = CashSession::query()->create([
            'user_id' => $user->id,
            'opened_at' => $at,
            'closed_at' => $at,
            'opening_amount' => 0,
            'closing_amount' => $total,
            'expected_amount' => $total,
            'difference' => 0,
            'status' => CashSession::STATUS_CLOSED,
        ]);

        $sale = Sale::query()->create([
            'reference' => Sale::nextReference(),
            'user_id' => $user->id,
            'cash_session_id' => $session->id,
            'status' => Sale::STATUS_COMPLETED,
            'payment_method' => Sale::PAYMENT_CASH,
            'total' => $total,
            'amount_paid' => $total,
            'change_amount' => 0,
            'remaining_amount' => 0,
        ]);
        $sale->created_at = $at;
        $sale->save();

        SaleItem::query()->create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => $total,
            'unit_cost' => 0,
        ]);
    }
}
