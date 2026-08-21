# Mini_market_system – Development Roadmap

**Last updated:** 21 August 2026 (Milestone 6 done; next is Milestone 7)

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
| **6 – POS / caisse (stock out, cash only)** | ✅ Done |
| **7 – Dashboard, stock history, reports** | ⬜ Not started |
| **8 – Shop PC install + live scanner test** | ⬜ Not started |

### Done in the code (Milestone 0 + 1 + 2 + 3 + 4 + 5 + 6)

- Spec files: `COMPLETE_SPEC.txt`, `docs/DATABASE_COLUMNS.md`, `docs/COMO_FUNCIONA_LA_APP.txt`
- Laravel **12.66** in `Mini_market_system/` via Composer (`composer create-project`)
- SQLite + `.env` (`APP_NAME=Mini_market_system`)
- Breeze + **Inertia React**, then converted to **TypeScript** (`.tsx`)
- **shadcn/ui** (button, input, label, checkbox, card, dialog, dropdown-menu)
- Login / logout / profile / dashboard (shadcn, not Breeze widgets)
- Public **Welcome** page removed (`/` → login or dashboard)
- Public **Register** removed
- Login is **username + password** (no email)
- Roles `owner` / `cashier`; seeded owner (`owner` / `password`)
- Owner **Users** screen: create user, pick role, disable account
- Gates: cashier cannot manage users, change prices, receive purchases, or delete products
- Shop tables: categories, suppliers, products, purchases, sales, stock movements, cash sessions, settings
- Demo seed: Drinks / Food / Cleaning, one supplier, Coca-Cola 1L + 2L
- Payments will be **cash only**
- App runs with `php artisan serve` + `npm run dev`
- **19 August 2026:**
  - shadcn **sidebar** using TMS navigation logic (`AppSidebar`: Dashboard + owner-only Users)
  - Authenticated layout: page content sits in `SidebarInset` (no longer under the sidebar)
  - Reusable Users table: search, sort, filters, pagination, create/edit modal
  - Fixed sort / ⋮ Edit / search (`Button` + `Input` forward refs; edit dialog outside the dropdown; `@/Components/ui/input` in `TableSearch`)
  - First git commit + GitHub remote: [Mini_market_gestion_stock_Laravel-inertia--react](https://github.com/mohamed-ali-atouhami/Mini_market_gestion_stock_Laravel-inertia--react)
  - Bugbot review of the initial commit: no bugs
  - Categories / suppliers / products screens (search, sort, filters, Active/Disabled, barcode scan-to-fill)
  - Sonner toasts for flash messages (`FlashToasts`)
- **20 August 2026:**
  - `StockService` is the only place that changes `products.stock_quantity` (increase / decrease / adjust + `stock_movements`)
  - Purchases: list, new delivery (scan + qty + cost), draft / receive / cancel, unknown barcode → create product now
  - Cashier cannot receive deliveries
  - Deliverable: receive 12× Coca-Cola 1L, stock 0 → 12, movement recorded
- **21 August 2026:**
  - Cash sessions: open with opening amount, one open session per user, close with counted cash / expected / difference
  - POS: scan-to-cart, cash pay, change, caisse must be open
  - `SaleService` decreases stock through `StockService`
  - Printable receipt; owner sales list
  - Deliverable: 2× Coca-Cola 1L + 1× 2L = 29 MAD, pay 50, change 21, stock down

### Not done yet (the real shop)

- Reports and shop-PC install

### Next step

**Milestone 7 – Dashboard, stock history & reports**

Today’s sales, low stock, movement history, settings.

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
- [x] Sales / POS: scan + cart + pay (cash only) → stock DOWN
- [x] Block sale if stock is not enough
- [ ] Stock movements ledger (never deleted)
- [ ] Manual stock adjustment (damage, loss, count correction) with reason
- [x] Cash session (open / close caisse)
- [ ] Dashboard: today sales, ticket count, low stock, stock value
- [ ] Reports: sales by period, purchases by supplier, movements, low stock, cash session
- [ ] Settings: shop name, currency (MAD), ticket footer
- [ ] Shop PC install notes (Laragon + shortcut + daily SQLite backup)

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
- ⏸️ Supplier credit / unpaid invoices
- ⏸️ Customer accounts
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
- Seed: sample categories, one supplier, Coca-Cola 1L / 2L (demo barcodes).
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

### Milestone 5 – Stock Engine & Purchases (Weeks 5–6)

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

### Milestone 6 – Caisse & POS (Weeks 7–8)

- **Cash sessions:**
  - Open caisse (opening amount)
  - Only one open session per cashier
  - Close caisse (counted amount, expected, difference)
- **POS / Sales:**
  - Guard: caisse must be open
  - Always-focused barcode box
  - Scan adds +1 to cart (or edit qty)
  - Live total, discount optional (simple)
  - Pay: cash only, amount paid, change
  - `SaleService` in one transaction: check stock, save sale + items, StockService decrease, movements
  - Printable receipt page (browser print). No thermal printer yet.
- Sale list + detail for owner.
- **Deliverables:** Scan 2× 1L + 1× 2L, pay 50 DH, change 23, stock drops, ticket saved.

### Milestone 7 – Dashboard, Stock History & Reports (Weeks 9–10)

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
  - Profit estimate (sale − cost) × qty sold
  - Stock movements filter
  - Cash session report
- **Settings:** shop name, address, phone, currency MAD, ticket footer, low-stock toggle.
- **Deliverables:** Owner can see the day, what to reorder, and a movement history.

### Milestone 8 – Permissions, Shop Install & Live Test (Weeks 11–12)

- Harden cashier menu (POS + own caisse + view stock only).
- Users CRUD already started in Milestone 2; polish if needed.
- QA pass of the A→Z story (delivery → receive → sell → close caisse).
- `npm run build` production assets.
- Write a short shop-PC install note (Laragon, copy folder, shortcut, daily backup of `database.sqlite`).
- Test with a real USB scanner if available (or keyboard: type barcode + Enter).
- **Deliverables:** App ready to copy to the shop PC. Owner shortcut works. Scanner types into Purchases and POS.

---

## 5. Post-MVP Milestones (High-Level)

- **Milestone 9:** NativePHP / Windows `.exe` (same app, desktop icon, no Chrome/localhost).
- **Milestone 10:** Receipt printer + cash drawer.
- **Milestone 11:** PostgreSQL + optional online hosting (check stock from a phone).
- **Milestone 12:** Pack barcode (scan carton = +6) and units of measure extras.
- **Milestone 13:** Supplier credit (buy now, pay later) and simple customer credit.
- **Milestone 14:** ERP extras per business: expiry/batches, variants, recipes.

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
- **Reason:** Owner scans the bottle code and types quantity 6. Matches how many small shops work.

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

1. **Start Milestone 7 – Dashboard, stock history & reports** — today’s sales, low stock, movements, settings.
2. Manual adjustments (damage / count) also belong here, through `StockService` only.

---

*This roadmap focuses on speed-to-value for one live mini market, while keeping a clean architecture so modules can be reused later (pharmacy, clothing, restaurant) without changing buy = stock in, sell = stock out.*
