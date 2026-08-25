<?php

namespace Tests\Feature\Auth;

use App\Models\CashSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_owner_is_redirected_to_dashboard_after_login(): void
    {
        $owner = User::factory()->owner()->create();

        $response = $this->post('/login', [
            'username' => $owner->username,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_cashier_is_redirected_to_caisse_after_login(): void
    {
        $cashier = User::factory()->cashier()->create();

        $response = $this->post('/login', [
            'username' => $cashier->username,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('caisse.index', absolute: false));
    }

    public function test_home_sends_owner_to_dashboard_and_cashier_to_caisse(): void
    {
        $owner = User::factory()->owner()->create();
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($owner)
            ->get('/')
            ->assertRedirect(route('dashboard'));

        $this->actingAs($cashier)
            ->get('/')
            ->assertRedirect(route('caisse.index'));
    }

    public function test_authenticated_cashier_visiting_login_is_sent_to_caisse(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($cashier)
            ->get('/login')
            ->assertRedirect(route('caisse.index'));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'username' => $user->username,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_inactive_users_cannot_authenticate(): void
    {
        $user = User::factory()->inactive()->create();

        $this->post('/login', [
            'username' => $user->username,
            'password' => 'password',
        ]);

        $this->assertGuest();
    }

    public function test_seeded_owner_can_log_in(): void
    {
        $this->seed();

        $this->post('/login', [
            'username' => 'younes',
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }

    public function test_user_cannot_logout_while_caisse_is_open(): void
    {
        $cashier = User::factory()->cashier()->create();
        $owner = User::factory()->owner()->create();

        foreach ([$cashier, $owner] as $user) {
            $this->actingAs($user)
                ->post(route('caisse.open'), ['opening_amount' => 100]);

            $this->actingAs($user)
                ->from(route('dashboard'))
                ->post('/logout')
                ->assertRedirect(route('caisse.index'))
                ->assertSessionHas('error', 'Close the caisse before signing out.');

            $this->assertAuthenticatedAs($user);
        }
    }

    public function test_user_can_logout_after_closing_caisse(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($cashier)
            ->post(route('caisse.open'), ['opening_amount' => 100]);

        $session = CashSession::query()
            ->where('user_id', $cashier->id)
            ->firstOrFail();

        $this->actingAs($cashier)
            ->post(route('caisse.close', $session), ['closing_amount' => 100]);

        $this->actingAs($cashier)
            ->post('/logout')
            ->assertRedirect('/');

        $this->assertGuest();
    }
}
