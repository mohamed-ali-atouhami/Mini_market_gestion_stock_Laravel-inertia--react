<?php

namespace App\Providers;

use App\Models\CustomerReturn;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Relation::enforceMorphMap([
            'Purchase' => Purchase::class,
            'Sale' => Sale::class,
            'CustomerReturn' => CustomerReturn::class,
        ]);

        Gate::define('manage-users', fn (User $user) => $user->isOwner());
        Gate::define('change-prices', fn (User $user) => $user->isOwner());
        Gate::define('receive-purchases', fn (User $user) => $user->isOwner());
        Gate::define('delete-products', fn (User $user) => $user->isOwner());
    }
}
