<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_users(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)
            ->get(route('users.index'))
            ->assertOk();
    }

    public function test_cashier_cannot_view_or_create_users(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($cashier)
            ->get(route('users.index'))
            ->assertForbidden();

        $this->actingAs($cashier)
            ->post(route('users.store'), [
                'name' => 'New Cashier',
                'username' => 'caisse2',
                'password' => 'password',
                'password_confirmation' => 'password',
                'role_id' => Role::query()->where('slug', Role::CASHIER)->value('id'),
            ])
            ->assertForbidden();
    }

    public function test_owner_can_create_a_cashier(): void
    {
        $owner = User::factory()->owner()->create();
        $cashierRoleId = Role::query()->where('slug', Role::CASHIER)->value('id');

        $this->actingAs($owner)
            ->post(route('users.store'), [
                'name' => 'Caisse 1',
                'username' => 'caisse1',
                'password' => 'password',
                'password_confirmation' => 'password',
                'role_id' => $cashierRoleId,
                'is_active' => 1,
            ])
            ->assertRedirect(route('users.index'));

        $this->assertDatabaseHas('users', [
            'username' => 'caisse1',
            'name' => 'Caisse 1',
            'role_id' => $cashierRoleId,
            'is_active' => 1,
        ]);
    }

    public function test_owner_can_disable_a_cashier(): void
    {
        $owner = User::factory()->owner()->create();
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($owner)
            ->patch(route('users.update', $cashier), [
                'name' => $cashier->name,
                'username' => $cashier->username,
                'role_id' => $cashier->role_id,
                'is_active' => 0,
            ])
            ->assertRedirect(route('users.index'));

        $this->assertFalse($cashier->refresh()->is_active);
    }

    public function test_owner_cannot_disable_their_own_account(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)
            ->from(route('users.edit', $owner))
            ->patch(route('users.update', $owner), [
                'name' => $owner->name,
                'username' => $owner->username,
                'role_id' => $owner->role_id,
                'is_active' => 0,
            ])
            ->assertRedirect(route('users.edit', $owner))
            ->assertSessionHasErrors('is_active');

        $this->assertTrue($owner->refresh()->is_active);
    }

    public function test_last_owner_cannot_be_demoted(): void
    {
        $owner = User::factory()->owner()->create();
        $cashierRoleId = Role::query()->where('slug', Role::CASHIER)->value('id');

        $this->actingAs($owner)
            ->from(route('users.edit', $owner))
            ->patch(route('users.update', $owner), [
                'name' => $owner->name,
                'username' => $owner->username,
                'role_id' => $cashierRoleId,
                'is_active' => 1,
            ])
            ->assertRedirect(route('users.edit', $owner))
            ->assertSessionHasErrors('role_id');

        $this->assertTrue($owner->refresh()->isOwner());
    }

    public function test_cashier_cannot_change_prices_receive_purchases_or_delete_products(): void
    {
        $cashier = User::factory()->cashier()->create();
        $owner = User::factory()->owner()->create();

        $this->assertFalse($cashier->can('manage-users'));
        $this->assertFalse($cashier->can('change-prices'));
        $this->assertFalse($cashier->can('receive-purchases'));
        $this->assertFalse($cashier->can('delete-products'));

        $this->assertTrue($owner->can('manage-users'));
        $this->assertTrue($owner->can('change-prices'));
        $this->assertTrue($owner->can('receive-purchases'));
        $this->assertTrue($owner->can('delete-products'));
    }
}
