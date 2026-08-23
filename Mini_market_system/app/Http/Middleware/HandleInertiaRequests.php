<?php

namespace App\Http\Middleware;

use App\Models\CashSession;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        if ($user) {
            $user->loadMissing('role');
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'role' => $user->role?->slug,
                    'is_active' => $user->is_active,
                ] : null,
            ],
            'can' => [
                'manageUsers' => $user?->can('manage-users') ?? false,
                'changePrices' => $user?->can('change-prices') ?? false,
                'receivePurchases' => $user?->can('receive-purchases') ?? false,
                'deleteProducts' => $user?->can('delete-products') ?? false,
            ],
            'shop' => $this->shop(),
            'cashSession' => $this->openCashSession($user),
            'flash' => [
                'status' => $request->session()->get('status'),
                'created_product' => $request->session()->get('created_product'),
            ],
        ];
    }

    /**
     * @return array{name: string, currency: string, low_stock_enabled: bool}
     */
    private function shop(): array
    {
        $defaults = [
            'name' => 'Mini market',
            'currency' => 'MAD',
            'low_stock_enabled' => true,
        ];

        if (! Schema::hasTable('settings')) {
            return $defaults;
        }

        $settings = Setting::query()->first();

        return [
            'name' => $settings?->shop_name ?? $defaults['name'],
            'currency' => $settings?->currency ?? $defaults['currency'],
            'low_stock_enabled' => $settings?->low_stock_enabled ?? true,
        ];
    }

    /**
     * @return array{id: int, opened_at: string|null}|null
     */
    private function openCashSession(?User $user): ?array
    {
        if ($user === null) {
            return null;
        }

        $session = CashSession::query()
            ->where('user_id', $user->id)
            ->where('status', CashSession::STATUS_OPEN)
            ->first();

        if ($session === null) {
            return null;
        }

        return [
            'id' => $session->id,
            'opened_at' => $session->opened_at?->format('Y-m-d H:i'),
        ];
    }
}
