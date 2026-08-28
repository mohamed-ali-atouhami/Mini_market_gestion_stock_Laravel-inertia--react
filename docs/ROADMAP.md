# Mini_market_system – Development Roadmap

**Last updated:** 28 August 2026 (purchase orders deferred until the owner asks)

---

## Progress (where we are)

| Milestone | Status |
|-----------|--------|
| **0 – Kickoff** (spec, stack, scanner rules) | ✅ Done |
| **1 – Foundations** (Laravel 12, Inertia, React, Tailwind, SQLite, shadcn, TypeScript) | ✅ Done |
| **2 – Auth & roles** (username login, owner/cashier, seed owner, owner creates users) | ✅ Done |
| **3 – Database tables** (products, purchases, sales, stock…) | ✅ Done |
| **4 – Categories / suppliers / products + barcode** | ✅ Done |
| **5 – Purchases (stock in)** | ✅ Done |
| **6 – POS / caisse (stock out, cash + credit)** | ✅ Done |
| **7 – Dashboard, stock history, reports** | ✅ Done |
| **8 – Shop PC install + live scanner test** | 🟡 Shortcut on this PC; copy to Younes later |

### Done in the code (through 26 August 2026)

- Spec files: `COMPLETE_SPEC.txt`, `docs/DATABASE_COLUMNS.md`, `docs/COMO_FUNCIONA_LA_APP.txt`
- Laravel **12** in `Mini_market_system/` — SQLite, Breeze + **Inertia React + TypeScript**, **shadcn/ui**
- Login is **username + password**. No public register / Welcome page. Roles `owner` / `cashier`
- Owner **Users** screen: create, role, disable. Gates: cashier cannot manage users, change prices, receive purchases, or delete products
- Shop tables: categories, suppliers, products, purchases, sales, stock movements, cash sessions, settings, customers, credit payments
- App runs with `php artisan serve` + `npm run dev` for development, or the **Mini market** desktop shortcut (no terminals) after `npm run build`
- GitHub: [Mini_market_gestion_stock_Laravel-inertia--react](https://github.com/mohamed-ali-atouhami/Mini_market_gestion_stock_Laravel-inertia--react)
- **19 August 2026:** sidebar, Users table, Categories / suppliers / products, barcode scan-to-fill, Sonner toasts
- **20 August 2026:** `StockService` only writer of stock; Purchases draft / receive / cancel; unknown barcode → create product
- **21 August 2026:** Caisse open/close; POS scan + cash pay; receipt; owner sales list
- **22 August 2026:** Dashboard, stock page + adjust, reports, settings
- **25 August 2026 — customer credit:**
  - Owner and cashier can sell on credit (goods leave now, pay 0 or a part, rest by a promised date)
  - Shared notebook: both see unpaid credits; either can collect (needs **their** open caisse)
  - Unpaid remainder does **not** inflate the till; caisse expected cash = cash sales + amount paid at sale + later collections
  - WhatsApp button opens `wa.me` with a pre-filled Arabic reminder (not Cloud API)
  - Dashboard “Credits due soon” only if due today/tomorrow; card hidden when empty
- **25 August 2026 — money / stock correctness:**
  - POS refreshes live price and stock before Pay; stops if the total changed or stock is short
  - Duplicate product lines on one ticket are merged (no double bill / double stock out)
  - `sale_items.unit_cost` snapshots cost **at sale**; reports profit uses that, not today’s catalog cost
  - Receiving a delivery updates product cost with a **weighted average**
  - Purchase barcode lookup and receive refuse disabled products
- **25 August 2026 — demo catalog seed:**
  - Users: `younes` (owner), `rabie` (cashier), `ahmed` (cashier, disabled). Password: `password`
  - 10 categories, 4 suppliers, 100 Morocco hanout products, stock 0 (fill stock by receiving a delivery)
  - Rebuild shop DB: `php artisan migrate:fresh --seed` (wipes sales, purchases, caisse, credits)

- **26 August 2026 — Milestone 8 on this PC:**
  - `npm run build` so the UI loads without `npm run dev`
  - Desktop shortcut **Mini market** runs a hidden `php artisan serve` and opens `http://127.0.0.1:8000` (PHP from XAMPP; Laragon not required)
  - Install note: `docs/SHOP_PC.md` (how to update features, weekly SQLite copy, how to copy the folder to the shop PC)
  - Cashier menu already hides owner screens; cashiers keep Dashboard, POS, Caisse, Credit
  - USB scanner still to test on the shop PC (keyboard Enter works today)

### Not done yet (the real shop)

- Copy the folder + shortcut onto Younes’s PC and test a real USB scanner there

### Next step

When Younes is ready: follow `docs/SHOP_PC.md` on his machine. New product features stay in this repo; rebuild + same shortcut.

---

## 1. Glossary
- **MVP (Minimum Viable Product):** The smallest, fastest version of the product that a real mini market can use every day. It contains only the critical features: create products (once), receive stock with a barcode scanner, sell at the caisse, keep stock correct, and see simple reports.
- **Milestone:** A checkpoint that marks the completion of a meaningful chunk of work. We do not start the next milestone until the current one is usable and tested.
- **Stock movement:** A permanent history line that says stock went IN (purchase) or OUT (sale / adjustment). Movements are the source of truth. The number on the product is only a cache.
- **HID scanner:** A USB barcode scanner that behaves like a keyboard. It types the barcode and presses Enter. No special driver. Works on localhost.
- **`is_active`:** Everyday “delete” in V1. The row stays in the table and still shows on the list as Disabled. POS / login ignore it. Uncheck to hide, check again to restore. Not the same as removing the row.
- **Soft delete (`deleted_at`):** Laravel hides the row from normal queries. It looks deleted but the row is still in the database. **Do not use in V1** — it duplicates `is_active` and fights unique barcodes (a “deleted” Coca-Cola 1L would still block a new one).
- **Safe delete:** A real `DELETE` that removes the row **only if nothing uses it**. Unused typo product / empty category → gone. Product that was purchased or sold → refuse; keep the row and use `is_active`. Owner only. See §6.

---

## 2. Recommended Fast Tech Stack

| Layer | Recommendation | Why it accelerates development |
|-------|----------------|--------------------------------|
| Backend | **Laravel 12** | Auth, policies, form requests, transactions, and services out of the box. Perfect for purchases/sales/stock. |
| CSS / UI | **Tailwind CSS + shadcn/ui** | Fast, consistent screens. Shop UI uses shadcn. |
| Frontend | **React + Inertia.js + TypeScript** | Fast POS/cart UI without a separate API. |
| Language | **PHP 8.2+ / TypeScript** | Already installed on the developer PC (PHP 8.2.12, Node 22). |
| Auth | **Laravel Breeze (customized)** | Login stays. No public register. Owner creates users. Username + roles in Milestone 2. |
| Database | **SQLite** | One file. No Docker, no MySQL/Postgres server. Easy copy to the shop PC. Real ACID transactions. |
| Architecture | **Services + Form Requests + Policies** | `PurchaseService`, `SaleService`, `StockService`. Thin controllers. Stock never changes outside StockService. |
| Versioning | **Git** | History and backup of the code. |
| Shop install (V1) | **Laragon + desktop shortcut** | Owner double-clicks “Mini_market_system”. Opens Chrome on localhost. No domain, no paid server. |
| Docker | **Not used** | SQLite needs no container. Docker stays installed but unused. |

**Why not PostgreSQL for V1:** One shop, one PC, no hosting budget. SQLite transactions are enough. Switch to PostgreSQL later if several PCs or online hosting are needed (Laravel makes that change small).

**Why not a separate React SPA:** Double the work. Inertia is the sweet spot for a caisse.

**Why not an `.exe` in V1:** NativePHP can wrap this same app later as `MiniMarket.exe`. First we make the web app work locally.

---

## 3. MVP Scope (First Release)

### Core Features (must work in a live shop)
- [x] App runs locally (Laravel 12 + Inertia React + TypeScript + shadcn + SQLite)
- [x] Public welcome and public register removed
- [x] User authentication and roles (Owner / Cashier) — username + password
- [x] Owner creates users and assigns role
- [x] Categories CRUD
- [x] Suppliers CRUD
- [x] Products CRUD: barcode, cost price, sale price, stock quantity, min stock, unit
- [x] Scan-to-fill barcode on product create/edit
- [x] Purchases (receive delivery): scan + quantity + receive → stock UP
- [x] Unknown barcode → create product now (barcode already filled)
- [x] Sales / POS: scan + cart + pay (cash or credit) → stock DOWN
- [x] Block sale if stock is not enough
- [x] Stock movements ledger (never deleted)
- [x] Manual stock adjustment (damage, loss, count correction) with reason
- [x] Cash session (open / close caisse)
- [x] Dashboard: today sales, ticket count, low stock, stock value
- [x] Customer credit at POS (pay later, collect, WhatsApp reminder)
- [x] Reports: sales by period, purchases by supplier, movements, profit from sale-time cost, cash session
- [x] Settings: shop name, currency (MAD), ticket footer
- [x] Shop shortcut on the developer PC (`docs/SHOP_PC.md`) — no `npm run dev` / visible `artisan serve`
- [ ] Copy to the shop PC + live USB scanner when the owner is ready

### Out of Scope for MVP (Deferred)
- ⏸️ Windows `.exe` / NativePHP (see Post-MVP)
- ⏸️ Paid hosting, domain, or online access from a phone
- ⏸️ PostgreSQL / multi-PC / multi-shop
- ⏸️ Receipt printer and cash drawer hardware
- ⏸️ Camera / phone barcode as the main scanner
- ⏸️ Pack barcode vs bottle barcode (V1: one barcode per product; owner types qty 6)
- ⏸️ Expiry dates / batches (pharmacy)
- ⏸️ Size/color variants (clothing)
- ⏸️ Recipes (restaurant)
- ⏸️ Supplier credit / unpaid invoices (buying from a supplier now, paying later)
- ⏸️ Supplier purchase orders (bon de commande before the truck — see §6)
- ⏸️ Full customer accounts / statements (V1 has simple POS credit only)
- ⏸️ Public self-registration (owner creates every user)
- ⏸️ Laravel marketing Welcome page

---

## 4. Roadmap & Milestones

> Assumes **8 hours/week** (same rhythm as the transport project). Each milestone ≈ 1–2 weeks. Adjust dates when we pick a start week.
>
> Build on the **developer PC**. Install on the **shop PC only at Milestone 8**.

### Milestone 0 – Project Kickoff (Week 0) ✅ *Done*

- Finalize stack and architecture (`COMPLETE_SPEC.txt`).
- Confirm barcode rules: all 1L Coke share one code; 1L and 2L are different products.
- Confirm install plan: local SQLite, no Docker, no domain.
- Create this roadmap and keep the spec as the source of truth.
- **Deliverables:** Stack decision, spec, Spanish simple explanation, this roadmap.

### Milestone 1 – Foundations (Weeks 1) ✅ *Done*

- Laravel 12 via `composer create-project` (not the `laravel` installer).
- Breeze Inertia React + Tailwind + SQLite.
- App name `Mini_market_system`.
- shadcn/ui added; Breeze widget components removed.
- Frontend converted to **TypeScript**.
- Public Welcome page removed. `/` redirects to login or dashboard.
- Public Register removed.
- **Not in M1:** Username login (M2). Git first commit done 19 August 2026.
- **Deliverables:** App runs. Login page. SQLite file. shadcn + TS. ✅

### Milestone 2 – Auth & Roles (Weeks 1–2) ✅ *Done*

- Login with **username + password** (no email). Customize Breeze login.
- Roles table: `owner`, `cashier` (policies check `slug`; no extra permissions tables).
- Seed first owner user (username e.g. `owner`).
- **Owner creates users** and picks the role (replaces public register).
- Cashier cannot create users, change prices, receive purchases, or delete products.
- Middleware / gates on routes.
- **Deliverables:** Sign in / sign out with username. Role-restricted menus. Seeded owner. Owner can add a cashier. ✅
- **19 Aug polish:** shadcn sidebar (TMS logic), working Users table (search / sort / filter / pagination / edit modal).

### Milestone 3 – Core Data Models (Week 2) ✅ *Done*

- Migrations for all V1 tables (see `docs/DATABASE_COLUMNS.md`):
  - `users`, `roles`
  - `categories`, `suppliers`, `products`
  - `purchases`, `purchase_items`
  - `sales`, `sale_items`
  - `stock_movements`
  - `cash_sessions`
  - `settings`
- Eloquent models + relationships.
- Seed: 10 categories, 4 suppliers, 100 Morocco hanout products, users `younes` / `rabie` / `ahmed`.
- **Deliverables:** Schema ready. `php artisan migrate:fresh --seed` works. ✅

### Milestone 4 – Master Data (Weeks 3–4) ✅ *Done*

- **Categories CRUD** — list, create, edit, activate/deactivate. No `destroy` in V1 (`is_active` only).
- **Suppliers CRUD** — name, phone, address, notes, activate/deactivate. No `destroy` in V1.
- **Products CRUD:**
  - name, category, barcode (unique)
  - cost price, sale price
  - stock quantity (read-only on the form after go-live; starting qty allowed on create)
  - min stock, unit, active flag
  - scan-to-fill barcode field (HID input + Enter)
- Reusable React pieces: `BarcodeInput`, `DataTable`, form layout.
- Product list: search by name or barcode, filter by category, low-stock highlight.
- **No hard delete in V1.** Hide with Active / Disabled. If the owner later creates many unused mistakes, add **safe delete** (see §6) — not Laravel SoftDeletes.
- **Deliverables:** Owner can create Coca-Cola 1L by scanning once and saving prices.

### Milestone 5 – Stock Engine & Purchases (Weeks 5–6) ✅ *Done*

- **StockService** (only place that changes `products.stock_quantity`):
  - `increase()` / `decrease()` / `adjust()`
  - writes `stock_movements` (type, direction, qty, before, after, reason, reference)
  - runs inside a DB transaction
  - refuses decrease below zero
- **Purchases module:**
  - New delivery: choose supplier, date, invoice number optional
  - Always-focused barcode box
  - Scan → add line (qty 1, cost from product) → owner edits qty (e.g. 12)
  - Unknown barcode → modal “create product now”
  - Receive: `PurchaseService` saves purchase + items, then StockService for each line
  - Status: draft / received / cancelled
  - Purchase list + detail
- **Deliverables:** Receive 12× Coca-Cola 1L. Stock goes 0 → 12. Movement recorded. Rollback if anything fails.

### Milestone 6 – Caisse & POS (Weeks 7–8) ✅ *Done*

- **Cash sessions:**
  - Open caisse (opening amount)
  - Only one open session per cashier
  - Close caisse (counted amount, expected, difference)
- **POS / Sales:**
  - Guard: caisse must be open
  - Always-focused barcode box
  - Scan adds +1 to cart (or edit qty)
  - Live total, discount optional (simple)
  - Pay: cash, or credit (part/zero now, rest later)
  - `SaleService` in one transaction: check stock, save sale + items (price + cost snapshot), StockService decrease, movements
  - Printable receipt page (browser print). No thermal printer yet.
- Sale list + detail for owner.
- **Deliverables:** Scan 2× 1L + 1× 2L, pay 50 DH, change 23, stock drops, ticket saved.

### Milestone 7 – Dashboard, Stock History & Reports (Weeks 9–10) ✅ *Done*

- **Stock page:** current qty, barcode, min stock, red row if low. Click → movements.
- **Adjustments:** damage / loss / count correction. Reason required. Through StockService only.
- **Dashboard:**
  - Today sales total and ticket count
  - Low stock list
  - Top selling products
  - Stock value (qty × cost price)
- **Reports:**
  - Sales by day / period
  - Purchases by supplier
  - Profit from cost stored on the ticket at sale (`sale_items.unit_cost`), not today’s product card
  - Stock movements filter
  - Cash session report
- **Settings:** shop name, address, phone, currency MAD, ticket footer, low-stock toggle.
- **Deliverables:** Owner can see the day, what to reorder, and a movement history.

### Milestone 8 – Permissions, Shop Install & Live Test (Weeks 11–12) 🟡 *Developer PC done*

- Cashier sidebar: POS, caisse, credit, dashboard. Owner-only: products, purchases, stock, reports, users.
- `npm run build` production assets in `public/build/`.
- Windows shortcut: `Mini_market_system/shop/start-shop.vbs` (hidden PHP server + browser). Create with `shop/create-desktop-shortcut.ps1`.
- Install note: `docs/SHOP_PC.md` (this PC uses XAMPP PHP; Laragon optional). SQLite backup = copy the file (weekly is enough if the PC is stable).
- Keyboard barcode (type + Enter) works. Real USB scanner on the shop PC when available.
- **Deliverables (this PC):** Double-click Mini market → login page, no developer terminals.
- **Still waiting:** paste the folder onto Younes’s PC and plug in his scanner.

---

## 5. Post-MVP Milestones (High-Level)

- **Milestone 9:** NativePHP / Windows `.exe` (same app, desktop icon, no Chrome/localhost).
- **Milestone 10:** Receipt printer + cash drawer.
- **Milestone 11:** PostgreSQL + optional online hosting (check stock from a phone).
- **Milestone 12:** Pack barcode (scan carton = +6) and units of measure extras.
- **Milestone 13:** Supplier credit (buy now, pay later). Simple **customer credit at POS is already in V1**.
- **Milestone 14:** Supplier purchase orders (bon de commande → receive) — **only if the owner asks**. See §6.
- **Milestone 15:** ERP extras per business: expiry/batches, variants, recipes.
<!-- Void sale just means cancel a ticket after it is already recorded. Example: cashier sold the wrong bottle, the stock already left, and the money is already on the till. Today there is no “undo that sale” button — they would have to fix stock by hand. That is a new feature, not a bug. We can add it later if you want. -->
---

## 6. Future Enhancements (Skipped from MVP)

### Windows desktop `.exe` (Milestone 9)
- **Status:** ⏸️ Skipped for MVP
- **Reason:** A Laragon shortcut is enough for one shop PC. An `.exe` is the same Laravel app wrapped with PHP + a private browser (NativePHP). Extra work after the shop already uses the app.

### Online hosting / domain
- **Status:** ⏸️ Skipped for MVP
- **Reason:** No budget. Local app keeps working if internet cuts (better for a caisse).

### Docker
- **Status:** ⏸️ Not used
- **Reason:** SQLite is a file. No database container needed.

### Hardware extras
- **Status:** ⏸️ Deferred
- **Reason:** USB HID scanner + browser print is enough. Thermal printer and drawer come after the flow is trusted.

### Multi-barcode / pack vs bottle
- **Status:** ⏸️ Deferred
- **Reason:** Owner scans the bottle code and types quantity 6. Matches how some small shops work.

### Supplier purchase orders (bon de commande)
- **Status:** ⏸️ Deferred — **do not build unless the owner asks for it**
- **What V1 already does:** Truck at the door → scan / type qty → **Receive** (stock up). **Save draft** is a list with no stock change yet. That is enough if he only deals with the driver at the door.
- **What this would add (iGoodar-style “paper side”):** Three steps instead of one till:
  1. **Bon de commande** — write the order *before* anything arrives (“Tuesday: 24 × Coca 1L”). Stock does **not** move. Print or keep a PDF.
  2. **Bon de livraison** — truck is here; tick what *actually* arrived (maybe 20, not 24). **Then** stock goes up. “Convert to delivery” = reuse the order list so he does not retype 20 lines.
  3. **Facture** — the supplier bill (money/debt), not the shelf.
- **When it is useful:** He often orders by WhatsApp days ahead and wants that list waiting when the truck comes, or he regularly gets “I asked for 24, they brought 18” and wants it written first.
- **When it is extra work:** Coca guy shows up, he counts crates, he scans. Paper chain feels like school paperwork.
- **If we add it:** Start with a simple **Order** (no stock) that becomes **Receive** (stock up). Do not copy a full PDF / BL / facture chain unless he already uses those papers today.

### Safe delete (unused mistakes only)
- **Status:** ⏸️ Deferred — add if the owner piles up unused rows (typo products, empty categories, suppliers never purchased from)
- **Not the same as `is_active`:** Active / Disabled hides a row that must stay (old tickets, purchases, stock movements). Safe delete **removes** a row that was never used.
- **Not Laravel SoftDeletes:** Do not add `deleted_at`. That hides rows from queries and still occupies unique barcodes. V1 already has `is_active`.
- **When to build:** After the shop is live, if Disabled leftovers become noisy. Not needed before purchases/POS.
- **Rules if we add it:**
  - Owner only (cashier already cannot `delete-products`).
  - ⋮ menu → Delete, confirm, then `DELETE` the row.
  - **Allow** when nothing references it: category with 0 products; supplier with 0 purchases; product with 0 purchase items, sale items, and stock movements (and stock 0).
  - **Refuse** with a toast if it is in history: “This product was sold or received. Disable it instead.”
  - Users: do not hard-delete. Disable the account so old tickets still show who sold.
  - Stock movements: never deleted.
- **Why wait:** A mistake product with no history is rare at first. Disable is enough until we see the owner doing it a lot.

---

## 7. Weekly Rhythm (Suggested)

1. **Plan (30 min):** Read the current milestone. Pick today’s tasks.
2. **Build (6–6.5 hrs):** One milestone slice. Do not jump to POS before StockService exists.
3. **Review (1 hr):** Click the flow (or type a barcode + Enter). Update this file if a task moved.
4. **Reflect (30 min):** Note blockers. Adjust next week.

**Hard build order (do not skip):**

```text
Setup → Auth → Schema → Categories/Suppliers/Products
      → StockService → Purchases
      → Cash session → POS
      → Dashboard/Reports → Shop install
```

---

## 8. Tooling Checklist

- Spec: `COMPLETE_SPEC.txt` (full rules, tables, scanner, shop PC).
- Simple story (Spanish): `COMO_FUNCIONA_LA_APP.txt`.
- This file: `docs/ROADMAP.md` — mark tasks `[x]` when done.
- Git: [GitHub repo](https://github.com/mohamed-ali-atouhami/Mini_market_gestion_stock_Laravel-inertia--react). Commit after each milestone.
- No Docker. No paid hosting in V1.
- Developer already has: PHP 8.2.12, Node 22, Composer 2.8, `pdo_sqlite`.

---

## 9. Next Actions

1. Double-click **Mini market** on the desktop (see `docs/SHOP_PC.md`). When Younes is ready, copy the folder to his PC.
2. After JS/CSS changes: `npm run build`. After new tables: `php artisan migrate` (never `fresh` on a live till).

---

*This roadmap focuses on speed-to-value for one live mini market, while keeping a clean architecture so modules can be reused later (pharmacy, clothing, restaurant) without changing buy = stock in, sell = stock out.*
