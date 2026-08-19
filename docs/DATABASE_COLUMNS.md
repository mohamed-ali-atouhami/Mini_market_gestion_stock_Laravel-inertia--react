# Mini_market_system – Database columns (V1 only — nothing unused)

This file is the exact list of tables and columns we will create.
If a column is not here, we do not add it.

---

## What POS means

**POS = Point of Sale.** In the shop that is the **caisse**: the screen where you scan bottles and take money.

| Word | Meaning |
|------|---------|
| **POS** | The *screen* (scan, cart, pay). Same as “caisse” / “punto de venta”. |
| **Sale** | The *ticket* saved in the database after Pay. |

They are the same action, two names:

- The cashier works on the **POS** page.
- When he clicks Pay, the app saves a **sale** (`sales` + `sale_items`) and stock goes down.

We are not building two systems. One caisse. One table for tickets.

---

## Rules for this schema

- One shop, one PC, SQLite.
- Every column must be used on a screen or in a stock transaction.
- We do **not** add: images, SKU, email, card payments, discounts, extra permission tables, pack barcodes.
- Login is **username + password** (no email).
- Every sale is **cash only**. No card column.
- `id` is always the primary key.
- `created_at` / `updated_at` only where we edit the row. Stock movements are never edited → only `created_at`.

---

## 1. `roles`

Who can do what. Only two rows: `owner`, `cashier`.

| Column | Type | Why we need it |
|--------|------|----------------|
| `id` | integer | Primary key |
| `name` | string | “Owner”, “Cashier” (shown on screen) |
| `slug` | string unique | `owner` / `cashier` — used in code (policies) |

**Dropped:** `permissions` and `permission_role`. Two roles are enough. Policies check `slug`. No extra tables.

---

## 2. `users`

People who log in.

| Column | Type | Why we need it |
|--------|------|----------------|
| `id` | integer | Primary key |
| `name` | string | Shown on tickets and “who received this delivery” |
| `username` | string unique | Login (e.g. `owner`, `caisse1`). Not an email. |
| `password` | string | Login |
| `role_id` | integer → roles | Owner or cashier |
| `is_active` | boolean | Off = cannot log in (ex-cashier) |
| `remember_token` | string | Laravel “remember me” |
| `created_at` | datetime | When the account was created |
| `updated_at` | datetime | When we edited the user |

**Dropped:** `email`, `email_verified_at`. No mail in this app. Login is username + password. We will change Laravel Breeze so it does not ask for email.

---

## 3. `categories`

Example: Drinks, Food, Cleaning.

| Column | Type | Why we need it |
|--------|------|----------------|
| `id` | integer | Primary key |
| `name` | string unique | “Drinks” |
| `is_active` | boolean | Hide without deleting old products |
| `created_at` | datetime | |
| `updated_at` | datetime | |

**Dropped:** `slug`. We open categories by `id`. No public URL.

---

## 4. `suppliers`

Who the owner buys from.

| Column | Type | Why we need it |
|--------|------|----------------|
| `id` | integer | Primary key |
| `name` | string | “Coca-Cola / wholesaler” |
| `phone` | string nullable | Call them |
| `address` | string nullable | Optional |
| `notes` | text nullable | “Pays on Friday” |
| `is_active` | boolean | Hide without deleting old purchases |
| `created_at` | datetime | |
| `updated_at` | datetime | |

**Dropped:** `email`. This app does not send mail to suppliers.

---

## 5. `products`

One row = one size = one barcode.  
All 1L Coke share one row. 2L is another row.

| Column | Type | Why we need it |
|--------|------|----------------|
| `id` | integer | Primary key |
| `category_id` | integer → categories | Filter / organize |
| `name` | string | “Coca-Cola 1L” |
| `barcode` | string unique, nullable | What the scanner types. Unique so two products cannot share a code. Null only if no barcode yet. |
| `cost_price` | decimal | What the owner pays the supplier (per bottle) |
| `sale_price` | decimal | What the customer pays |
| `stock_quantity` | decimal | How many are in the shop now. Changed **only** by StockService. |
| `min_stock` | decimal | If stock ≤ this, dashboard shows red “buy again” |
| `unit` | string | `piece` (default). Ready for `kg` later. |
| `is_active` | boolean | Hide without deleting history |
| `created_at` | datetime | |
| `updated_at` | datetime | |

**Dropped:**

- `sku` — the barcode is the code. No second internal code.
- `image_path` — not needed to sell. Add later if they want photos.
- `description` — name is enough.

---

## 6. `purchases`

One row = one delivery (the paper when the truck arrives).

| Column | Type | Why we need it |
|--------|------|----------------|
| `id` | integer | Primary key |
| `reference` | string unique | Auto: `PUR-2026-0001` — easy to find |
| `supplier_id` | integer → suppliers | Who delivered |
| `user_id` | integer → users | Who clicked Receive |
| `invoice_number` | string nullable | Number on the supplier paper |
| `status` | string | `draft` / `received` / `cancelled` |
| `purchase_date` | date | Day of the delivery |
| `notes` | text nullable | Optional |
| `total` | decimal | Sum of lines. Stored so the list is fast. |
| `created_at` | datetime | |
| `updated_at` | datetime | |

---

## 7. `purchase_items`

One row = one product on that delivery.

| Column | Type | Why we need it |
|--------|------|----------------|
| `id` | integer | Primary key |
| `purchase_id` | integer → purchases | Which delivery |
| `product_id` | integer → products | Coca-Cola 1L |
| `quantity` | decimal | 12 bottles |
| `unit_cost` | decimal | Buy price **that day** (if the supplier changes price later, old tickets stay correct) |

**Dropped:** `line_total`. The app calculates `quantity × unit_cost`. No extra column.

---

## 8. `cash_sessions`

One row = one time the caisse was opened and later closed.

| Column | Type | Why we need it |
|--------|------|----------------|
| `id` | integer | Primary key |
| `user_id` | integer → users | Who opened the caisse |
| `opened_at` | datetime | Start |
| `closed_at` | datetime nullable | Empty while open |
| `opening_amount` | decimal | Cash already in the drawer (e.g. 200) |
| `closing_amount` | decimal nullable | What they counted at night |
| `expected_amount` | decimal nullable | What the app thinks should be there |
| `difference` | decimal nullable | counted − expected |
| `status` | string | `open` / `closed` |

**Dropped:** `notes`. Not needed to open/close a drawer.

POS cannot sell if there is no `open` session for that cashier.

---

## 9. `sales`

One row = one ticket after the cashier clicks **Pay** on the POS.

| Column | Type | Why we need it |
|--------|------|----------------|
| `id` | integer | Primary key |
| `reference` | string unique | Auto: `SAL-2026-0001` |
| `user_id` | integer → users | Which cashier |
| `cash_session_id` | integer → cash_sessions | Which caisse opening |
| `status` | string | `completed` / `cancelled` |
| `total` | decimal | What the customer must pay |
| `amount_paid` | decimal | Cash they gave (e.g. 50) |
| `change_amount` | decimal | What we return (e.g. 23) |
| `created_at` | datetime | When the ticket was made |
| `updated_at` | datetime | If cancelled later |

**Dropped:**

- `sale_date` — `created_at` is the time of the sale. No second date.
- `subtotal` — same as `total` if there is no discount.
- `discount` — not in V1. Add later if the owner wants it.
- `payment_method` — always cash. No card, no mixed. No column.

---

## 10. `sale_items`

One row = one product on that ticket.

| Column | Type | Why we need it |
|--------|------|----------------|
| `id` | integer | Primary key |
| `sale_id` | integer → sales | Which ticket |
| `product_id` | integer → products | Coca-Cola 1L |
| `quantity` | decimal | 2 bottles |
| `unit_price` | decimal | Sell price **that day** (if the owner changes the price tomorrow, old tickets stay correct) |

**Dropped:** `line_total`. The app calculates `quantity × unit_price`.

---

## 11. `stock_movements`

The notebook of every in/out. **Never updated. Never deleted.**

| Column | Type | Why we need it |
|--------|------|----------------|
| `id` | integer | Primary key |
| `product_id` | integer → products | Which product |
| `user_id` | integer → users | Who did it |
| `type` | string | `purchase` / `sale` / `adjustment` |
| `direction` | string | `in` or `out` |
| `quantity` | decimal | Always positive (12, not −12). Direction says in or out. |
| `quantity_before` | decimal | Stock before this line (0) |
| `quantity_after` | decimal | Stock after this line (12) |
| `reference_type` | string nullable | `Purchase` or `Sale` (empty for a manual adjustment) |
| `reference_id` | integer nullable | Id of that purchase or sale |
| `reason` | string | `purchase`, `sale`, `damaged`, `lost`, `count correction` |
| `created_at` | datetime | When it happened |

**Dropped:**

- `updated_at` — we never edit a movement.
- `unit_cost` — cost lives on the product / purchase line. Not needed again here.
- `return` type — no customer returns in V1.

---

## 12. `settings`

One row only. Shop info for the ticket and the header.

| Column | Type | Why we need it |
|--------|------|----------------|
| `id` | integer | Always 1 |
| `shop_name` | string | Printed on the ticket |
| `shop_phone` | string nullable | Ticket / header |
| `shop_address` | string nullable | Ticket |
| `currency` | string | `MAD` |
| `ticket_footer` | string nullable | “Thank you” |
| `low_stock_enabled` | boolean | Show red alerts or not |
| `updated_at` | datetime | Last edit |

**Dropped:** key/value dump. A single row is clearer and has no empty keys.

---

## Tables we will NOT create in V1

| Table | Why not |
|-------|---------|
| `permissions` / `permission_role` | Two roles + policies are enough |
| `product_barcodes` | One barcode column on `products` |
| `customers` | Walk-in only |
| `payments` (extra table) | Always cash. `amount_paid` + `change_amount` on `sales` is enough |
| `warehouses` | One shop, one stock number |

---

## How the columns connect (A → Z)

```text
roles 1──* users

categories 1──* products
suppliers  1──* purchases 1──* purchase_items *──1 products
users      1──* purchases
users      1──* cash_sessions 1──* sales 1──* sale_items *──1 products
users      1──* sales
users      1──* stock_movements
products   1──* stock_movements
```

1. Owner creates **product** (barcode, cost_price, sale_price, min_stock).
2. Truck: **purchase** + **purchase_items** (quantity, unit_cost) → stock_quantity UP + **stock_movement** `in`.
3. Caisse: open **cash_session**.
4. POS: **sale** + **sale_items** (quantity, unit_price) → stock_quantity DOWN + **stock_movement** `out`.
5. Night: close **cash_session** (opening / expected / counted).

---

*If we need a new column later (discount, image, pack barcode), we add it in a new migration. We do not add it “just in case” now.*
