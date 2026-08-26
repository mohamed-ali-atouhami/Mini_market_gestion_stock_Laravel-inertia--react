# Mini market stock system

Laravel 12 + Inertia React + TypeScript + Tailwind app for a mini market in Morocco (cash + simple credit).

The runnable app lives in `Mini_market_system/`. Specs and the roadmap are in `docs/`.

## Open like a shop (no developer terminals)

```bat
cd Mini_market_system
npm run build
powershell -ExecutionPolicy Bypass -File shop\create-desktop-shortcut.ps1
```

Then double-click **Mini market** on the desktop. Details: `docs/SHOP_PC.md`.

Login: `younes` / `password` (owner). Cashiers: `rabie` / `password`. `ahmed` is disabled.

## Develop (hot reload)

```bash
cd Mini_market_system
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install
npm run dev
```

In another terminal: `php artisan serve`.
