<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $chosen = $request->session()->get('locale') ?? $request->cookie('locale');
        $locale = is_string($chosen) ? $chosen : config('app.locale');

        if (! in_array($locale, ['en', 'fr', 'es', 'ar'], true)) {
            $locale = 'en';
        }

        if ($request->session()->get('locale') !== $locale) {
            $request->session()->put('locale', $locale);
        }

        app()->setLocale($locale);

        // A cookieless request, such as the shortcut warming the sign-in page,
        // must not replace the language the shop last chose.
        if (in_array($chosen, ['en', 'fr', 'es', 'ar'], true)) {
            $this->rememberShopLocale($chosen);
        }

        return $next($request);
    }

    /**
     * The desktop shortcut reads this file before PHP is ready.
     */
    private function rememberShopLocale(string $locale): void
    {
        if (app()->runningUnitTests()) {
            return;
        }

        try {
            $path = storage_path('app/shop-locale.txt');
            $current = is_file($path) ? trim((string) file_get_contents($path)) : null;

            if ($current === $locale) {
                return;
            }

            file_put_contents($path, $locale);
        } catch (\Throwable $exception) {
            // A splash hint must never stop a sale or a sign-in.
        }
    }
}
