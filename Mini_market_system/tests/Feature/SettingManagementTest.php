<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_settings(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)
            ->get(route('settings.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Settings/Index'));

        $this->actingAs($owner)
            ->patch(route('settings.update'), [
                'shop_name' => 'Souk Mini',
                'shop_phone' => '0522000000',
                'shop_address' => 'Casablanca',
                'currency' => 'MAD',
                'ticket_footer' => 'Thank you',
                'low_stock_enabled' => 0,
            ])
            ->assertRedirect(route('settings.edit'));

        $this->assertDatabaseHas('settings', [
            'shop_name' => 'Souk Mini',
            'low_stock_enabled' => 0,
        ]);
        $this->assertFalse(Setting::current()->low_stock_enabled);
    }

    public function test_cashier_cannot_edit_settings(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($cashier)
            ->get(route('settings.edit'))
            ->assertForbidden();
    }
}
