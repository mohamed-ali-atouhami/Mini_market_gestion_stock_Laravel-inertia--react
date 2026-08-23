<?php

namespace Tests\Feature;

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
}
