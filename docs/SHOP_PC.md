# Shop PC — open the app from a shortcut (Milestone 8)

This PC already has PHP (XAMPP). You do **not** need Laragon or `npm run dev` to sell.

SQLite stays the database. The shortcut does not replace backups; it only starts the shop without a developer terminal.

## Every morning (after the shortcut exists)

1. Double-click **Mini market** on the desktop.
2. Chrome (or Edge) opens `http://127.0.0.1:8000`.
3. Log in (`younes` / `password` for the owner).
4. Open the caisse, then sell.

No `php artisan serve`. No `npm run`. PHP starts when the shop window opens and **stops when you close that window**.

You do **not** need `stop-shop.ps1` for a normal day. That command is only a backup if PHP is stuck.

Close the **Mini market window** (the one the shortcut opens). Do not only close some other Chrome tab — the shop uses its own window so your normal browser can stay open.

## One-time setup on this PC

From `Mini_market_system/`:

```bat
npm run build
powershell -ExecutionPolicy Bypass -File shop\create-desktop-shortcut.ps1
```

Then double-click **Mini market** on the desktop.

`npm run build` writes the UI into `public/build/`. The shortcut **removes** `public/hot` if it exists, so an old `npm run dev` session cannot steal the page.

## When you add features later

You do **not** remake the shortcut.

| You changed | Do this, then refresh the browser |
|---|---|
| PHP only | Nothing else on this PC |
| New migration | `php artisan migrate` (never `migrate:fresh` on a live till) |
| React / CSS | `npm run build` |

Same desktop icon. Same URL. New code is in the project folder.

## Copy to Younes’s PC later

1. On your PC: `npm run build`.
2. Copy the whole `Mini_market_system` folder (include `vendor`, `public/build`, `database/database.sqlite`, `.env`). He does not need Node or Git.
3. He needs **PHP** (XAMPP or Laragon). `php` must work in a terminal once, to prove it.
4. On his PC run `shop\create-desktop-shortcut.ps1`.
5. Plug in the USB scanner. It types like a keyboard: barcode + Enter in Purchases or POS.

Do not run `migrate:fresh` on his till after real sales exist.

## Backup (weekly is enough if the PC is stable)

Copy `Mini_market_system/database/database.sqlite` to a USB stick or Drive. Closing the browser does **not** erase data. Backup is only if the disk dies or someone runs `migrate:fresh`.

## Scanner

No extra driver. Click the barcode box, scan (or type the code and press Enter).
