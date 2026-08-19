<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_suppliers(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)
            ->get(route('suppliers.index'))
            ->assertOk();
    }

    public function test_cashier_cannot_view_or_create_suppliers(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($cashier)
            ->get(route('suppliers.index'))
            ->assertForbidden();

        $this->actingAs($cashier)
            ->post(route('suppliers.store'), [
                'name' => 'Atlas Wholesale',
            ])
            ->assertForbidden();
    }

    public function test_owner_can_create_a_supplier(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)
            ->post(route('suppliers.store'), [
                'name' => 'Atlas Wholesale',
                'phone' => '0522123456',
                'address' => 'Casablanca',
                'notes' => 'Pays on Friday',
                'is_active' => 1,
            ])
            ->assertRedirect(route('suppliers.index'));

        $this->assertDatabaseHas('suppliers', [
            'name' => 'Atlas Wholesale',
            'phone' => '0522123456',
            'address' => 'Casablanca',
            'notes' => 'Pays on Friday',
            'is_active' => 1,
        ]);
    }

    public function test_owner_can_update_a_supplier(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create(['name' => 'Old Name']);

        $this->actingAs($owner)
            ->patch(route('suppliers.update', $supplier), [
                'name' => 'New Name',
                'phone' => '0600000000',
                'address' => '',
                'notes' => '',
                'is_active' => 1,
            ])
            ->assertRedirect(route('suppliers.index'));

        $supplier->refresh();

        $this->assertSame('New Name', $supplier->name);
        $this->assertSame('0600000000', $supplier->phone);
        $this->assertNull($supplier->address);
        $this->assertNull($supplier->notes);
    }
}
