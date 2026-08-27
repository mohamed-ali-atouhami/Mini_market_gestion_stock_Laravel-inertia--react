<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_switch_locale_to_arabic(): void
    {
        $this->from(route('login'))
            ->post(route('locale.update'), ['locale' => 'ar'])
            ->assertRedirect(route('login'));

        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/Login')
                ->where('locale', 'ar')
            );
    }

    public function test_owner_locale_persists_on_dashboard(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)
            ->from(route('dashboard'))
            ->post(route('locale.update'), ['locale' => 'ar'])
            ->assertRedirect(route('dashboard'));

        $this->actingAs($owner)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('locale', 'ar')
            );
    }

    public function test_invalid_locale_is_rejected(): void
    {
        $this->from(route('login'))
            ->post(route('locale.update'), ['locale' => 'fr'])
            ->assertSessionHasErrors('locale');
    }

    public function test_english_is_the_default_locale(): void
    {
        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('locale', 'en'));
    }
}
