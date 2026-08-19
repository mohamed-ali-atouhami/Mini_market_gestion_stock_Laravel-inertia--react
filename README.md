# Mini market stock system

Laravel 12 + Inertia React + TypeScript + Tailwind app for a cash-only mini market in Morocco.

The runnable app lives in `Mini_market_system/`. Specs and the roadmap are in `docs/`.

## Run locally

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

Login: `owner` / `password`.
