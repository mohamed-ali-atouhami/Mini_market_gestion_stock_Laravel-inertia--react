# How the mini market app works

**Last updated:** 23 August 2026 (Milestones 1–7). Milestone 8 is shop-PC install — not built yet.

This is the shop story, not the programmer roadmap. For build order, read `docs/ROADMAP.md`.

Read it like someone is sitting next to you and pointing at the screen.

---

## Resume (what this app is)

This is a **notebook for one small shop** on one computer.

It remembers:

- **what you sell** (products, barcodes, prices)
- **who you buy from** (suppliers)
- **when the truck arrives** (purchases → stock goes up)
- **when a customer pays** (POS sales → stock goes down)
- **how much cash is in the drawer** (caisse open / close)
- **every bottle that moved** (stock history)
- **how the day / week went** (dashboard + reports)

Money is **MAD** (dirhams). Payments are **cash only**. No card. No discount in this version.

The one idea you must never forget:

- A **truck** arrives → bottles go **into** the box. That is a **purchase**. Stock goes **up**.
- A **customer** buys → bottles leave the box. That is a **sale**. Stock goes **down**.
- A bottle **breaks** or the shelf count is wrong → you **adjust** on Stock. That is not a sale and not a purchase.

The number on the product is “how many are in the box right now.”

You cannot sell what is not in the box.  
After the shop is running, you do **not** type a new stock number on the product screen. Stock only moves when you **receive a delivery**, **pay on POS**, or **adjust on Stock**.

---

## Two people

There are only two kinds of login. There is **no public Register** page. Only the owner creates users.

### Owner (the boss)

Login for the demo: username **`owner`**, password **`password`**.

The owner sees the whole sidebar and can do every job: create the cashier, create products, receive the truck, open the caisse, sell, look at history, look at reports.

### Cashier (the person at the till)

The cashier only needs **Dashboard**, **POS**, and **Caisse**.

The cashier **cannot**:

- open Users, Products, Categories, Suppliers, Purchases, Tickets sales, Stock, Reports, or Settings
- change sale prices
- receive the truck
- disable products
- create users

There is **no cashier in the seed**. First time, log in as owner. If you want a cashier, create one under **Users**.

---

## How to start the app (developer PC)

Two terminals, both inside `Mini_market_system`:

1. `php artisan serve` — PHP (usually http://127.0.0.1:8000)
2. `npm run dev` — React pages (Vite)

Open http://127.0.0.1:8000  
Not logged in → **Login**. Already logged in → **Dashboard**.

You do **not** need a real barcode scanner to test. A cheap USB scanner only **types the numbers and presses Enter**. Until you buy one, type the barcode yourself and press **Enter**. Same thing.

---

## What already exists (the real demo shop)

The seed is not empty. These rows are in the database from the start.

### Shop settings

| Field | Demo value |
|---|---|
| Shop name | Mini market |
| Currency | MAD |
| Ticket footer | Thank you |
| Highlight low stock | On |

### Users

| Username | Password | Role |
|---|---|---|
| `owner` | `password` | Owner |

No cashier until you create one.

### Categories

| Name | Meaning |
|---|---|
| **Drinks** | Coca-Cola, later Sprite / Fanta if you add them |
| **Food** | Empty shelf label. Ready when you add biscuits, oil… |
| **Cleaning** | Empty shelf label. Ready when you add soap… |

Everyday “delete” is **Active / Disabled**. The row stays. Old tickets still know “this was a Drink.”

### One supplier

| Field | Demo value |
|---|---|
| Name | **Coca-Cola Distribution** |
| Phone | `0522000000` |
| Address | Casablanca |
| Notes | Pays on Friday |

### Two products (stock starts at **0**)

| Product | Barcode (type + Enter) | You buy it for | You sell it for | Warn if stock ≤ |
|---|---|---|---|---|
| Coca-Cola 1L | `6110000000017` | 5.50 MAD | **8 MAD** | 12 |
| Coca-Cola 2L | `6110000000024` | 9.00 MAD | **13 MAD** | 8 |

**Very important:** stock is **0** until you receive a purchase. If you go to POS first, the sale fails: not enough stock.

You can add more products later the same way (Sprite 1L, Fanta 1L, Coca-Cola zero…). They work like the two Cokes: one barcode, one cost, one sale price, one min stock.

---

## The rooms (sidebar)

After login, the left sidebar is the shop. Order is the day, then the goods, then rare admin.

| Sidebar | Who | What |
|---|---|---|
| Dashboard | Owner and cashier | Today’s sales, tickets, stock value, low stock, top selling. |
| POS | Owner and cashier | The till. Scan. Pay. |
| Caisse | Owner and cashier | Open / close the cash drawer. |
| Tickets sales | Owner only | List of tickets after customers paid. |
| Purchases | Owner only | The truck. Stock goes up. |
| Stock | Owner only | Stock vs min stock. **History**. Damage / count adjust. |
| Products | Owner only | Each bottle: barcode, prices, stock. |
| Categories | Owner only | Drinks, Food, Cleaning. |
| Suppliers | Owner only | Who the truck belongs to. |
| Reports | Owner only | Sales, purchases, profit, caisse, movements by date. |
| Settings | Owner only | Shop name, phone, address, currency, ticket footer, low-stock red. |
| Users | Owner only | Create cashier / disable accounts. |

Footer: your name (Profile) and **Log out**.

---

## Full shop day: morning to night

This is one real day on the demo. Do it once so you feel the shop.

Numbers in this story:

- Receive **12** × Coca-Cola 1L and **8** × Coca-Cola 2L
- Open the drawer with **200 MAD** (change money, not a sale)
- Sell **2** × 1L + **1** × 2L = **29 MAD**, customer pays **50**, change **21**
- Break **1** bottle of 1L (adjust out)
- Close the drawer
- Look at **Dashboard**, **Stock history**, **Reports**
- Log out

---

### 1. Morning — login

1. Open the app.
2. Username **`owner`**.
3. Password **`password`**.
4. Click **Login**.

You land on **Dashboard**.

If the shelves are still at 0 and you have not sold yet, today sales is **0.00 MAD**, tickets **0**, stock value **0**. Low stock can already show the Cokes if stock (0) is ≤ min stock (12 and 8). That red is normal: the box is empty.

---

### 2. Morning — create a cashier (optional, first week only)

1. Sidebar **Users**.
2. Create user: name `Cashier`, username `cashier`, password you choose, role **cashier**.
3. Save.

Tomorrow that person logs in with their username. They only see Dashboard, POS, Caisse.

You stay as owner for this story.

---

### 3. Morning — the truck (stock in)

The box is empty. POS cannot sell empty air. Receive first.

1. Sidebar **Purchases** → **New delivery**.
2. Supplier: **Coca-Cola Distribution**.
3. Date is today. Invoice number is optional.
4. Click **Scan barcode**.
5. Type `6110000000017` and press **Enter**.
6. A line appears: Coca-Cola 1L, quantity **1**, cost 5.50.
7. Change quantity to **12**.
8. Click **Receive**.

What the app does in one step (all or nothing):

- saves the purchase paper
- stock of 1L goes **0 → 12**
- writes a **stock movement**: type `purchase`, direction `in`, qty 12, reason `purchase`

Do the same for 2L: new delivery, scan `6110000000024`, qty **8**, **Receive**. Stock of 2L: **0 → 8**.

Now **Products** shows:

- Coca-Cola 1L = **12**
- Coca-Cola 2L = **8**

Stock value on the dashboard is roughly  
12 × 5.50 + 8 × 9.00 = **66 + 72 = 138 MAD**  
(that is cost, not selling price).

#### Draft vs Receive vs Cancel

- **Save draft**: paper started, boxes still on the truck. Stock does **not** go up.
- **Receive**: boxes on the shelf. Stock **goes up**.
- **Cancel draft**: throw the unfinished paper away. You cannot cancel a received delivery in this version.

#### Unknown barcode on Purchases

If you scan a code the app never saw, the owner can **create this product now** (barcode already filled), then continue the delivery. A cashier never sees this screen.

Only the **owner** can receive the truck.

---

### 4. Morning — open the caisse

POS is the selling screen. Caisse is the drawer of money.

You **must open the caisse before you sell**. If the drawer is closed, POS sends you to Caisse: “Open the caisse before selling.”

One person can have only **one open caisse**. Close it before opening a new one.

**200 is not a sale. It is not Coca-Cola. It is not profit.**

It is the cash **already in the drawer** so you can give change.

A customer will pay **50** for a ticket of **29**. You must give **21** back. If the drawer is empty, you cannot give change.

1. Sidebar **Caisse**.
2. **Opening amount**: type `200`.
3. Click **Open caisse**.
4. You should see **Open**, Opening **200**, Sales **0**, Expected **200**.
5. Go to **POS**.

You could type **0**, **100**, or **350**. The app only remembers: *this is how much was there at open.*

---

### 5. Day — sell on POS

The cart lives **only on this screen** until **Pay**. Leave POS before paying → cart is gone. Nothing sold. Stock did not move.

#### The demo ticket

| Line | Qty | Price | Line total |
|---|---|---|---|
| Coca-Cola 1L (`6110000000017`) | 2 | 8 | 16 |
| Coca-Cola 2L (`6110000000024`) | 1 | 13 | 13 |
| **Total** | | | **29 MAD** |

Customer pays **50**. Change = 50 − 29 = **21 MAD**.

#### Click by click

1. Caisse is **Open**.
2. Sidebar **POS**.
3. Type `6110000000017` + **Enter**. Line: 1L, qty 1, price 8.
4. Same code + **Enter** again. Qty **2**. Subtotal 16.
5. Type `6110000000024` + **Enter**. 2L, qty 1, price 13.
6. **Total: 29.00 MAD**.
7. **Amount paid**: `50`. **Change: 21.00**.
8. Click **Pay**.

You go to the **receipt**: shop name Mini market, lines, total 29, paid 50, change 21, footer “Thank you”.

- **Print** = browser print dialog.
- **New sale** = empty cart, next customer.

Then **Products**:

- 1L was 12, now **10**
- 2L was 8, now **7**

Both are now **low stock**: 1L is 10 and min is 12; 2L is 7 and min is 8. Red means stock ≤ that product’s own min, not a global “under 10.”

#### What Pay does (all or nothing)

1. Caisse still open.
2. Each product still active.
3. Enough stock.
4. Save ticket (`SAL-2026-0001` style).
5. Save each line.
6. Decrease stock.
7. Write movements: type `sale`, direction `out`.
8. Show the receipt.

Prices come from the **database**, not from what the cashier typed.

#### If something is wrong

| What you try | What happens |
|---|---|
| POS while caisse is closed | You land on Caisse. Open first. |
| Unknown barcode | Toast: Product not found. No create popup. |
| Qty 20 when stock is 10 | Not enough stock. No ticket. |
| Paid `20` when total is 29 | Error: paid less than the total. |
| Inactive product | Cannot sell it. |
| Open caisse twice | Close the current one first. |

---

### 6. Day — look at the ticket again (owner)

Sidebar **Tickets sales**. You see `SAL-….` Open it. Same 29 / 50 / 21. **Receipt** opens the printable page again.

The cashier does not have this menu. Their receipt is the page right after Pay.

---

### 7. Afternoon — a bottle broke (Stock history + adjust)

This is the part that is not a sale and not a truck.

1. Sidebar **Stock**.
2. You see every product: name, barcode, stock, min stock.
3. Red row = stock ≤ **that product’s** min stock. Not a global “under 10”.
   - 1L: stock 10, min 12 → red
   - 2L: stock 7, min 8 → red
4. Click **History** on Coca-Cola 1L.

#### What History is

A diary of **this one product**. Newest first. You see about the last 50 lines.

After the morning so far, 1L history looks like this:

| When | Type / direction | Qty | Before → after | Reason | Who |
|---|---|---|---|---|---|
| After the sale | `sale` / `out` | 2 | 12 → 10 | sale | Owner |
| After the truck | `purchase` / `in` | 12 | 0 → 12 | purchase | Owner |

If you created the product with a starting stock, you would also see `adjustment` / `in` with reason **Opening stock**.

#### Adjust (damage or wrong count)

A bottle of 1L falls and breaks.

1. Still on that History page.
2. **Direction**: Out (damage, loss, count down).
3. **Quantity**: `1`.
4. **Reason**: `Broke a bottle` (required).
5. **Save adjustment**.

Stock of 1L: **10 → 9**. A new line appears:

| Type / direction | Qty | Before → after | Reason |
|---|---|---|---|
| `adjustment` / `out` | 1 | 10 → 9 | Broke a bottle |

You cannot go below zero. If stock is 9 and you try Out 20, the app refuses.

**In** is the opposite: you found an extra bottle on the shelf, or you counted up. Same form, direction In, reason required. Example: `1` and `Found one behind the fridge`.

This does **not** create a ticket. No money. Only the box of bottles changes. The reason stays in the history forever.

---

### 8. Evening — Dashboard (how is today?)

Sidebar **Dashboard**. After this story you should see something like:

| Card | Meaning | Example after this day |
|---|---|---|
| **Today sales** | Sum of completed ticket **totals** (29, not the 50 the customer handed you) | 29.00 MAD |
| **Tickets today** | How many customers paid | 1 |
| **Stock value** | Every product: stock × **cost** (what you paid the supplier) | 1L: 9 × 5.50 = 49.50; 2L: 7 × 9.00 = 63; **112.50 MAD** |
| **Low stock** | Stock ≤ that product’s min, if the Settings toggle is on | 1L (9 / 12), 2L (7 / 8) |
| **Top selling today** | What left the shelf on **sales** today | Coca-Cola 1L qty 2 total 16; Coca-Cola 2L qty 1 total 13 |

The broken bottle is **not** in top selling. It is only in Stock history.

Owner can click **Stock** on the low-stock card. That opens Stock already filtered to **Low stock**.

If Settings has **Highlight low stock** off, the dashboard list stays empty and Products/Stock stop painting red. The numbers are still there; the warning is off.

The cashier can see Dashboard. They cannot open Stock, Reports, or Settings.

---

### 9. Evening — Reports (the week / the day on paper)

Sidebar **Reports**. This is the owner’s “show me a period” screen.

1. **From** and **To** are dates. First visit: from the 1st of this month to today.
2. Change them if you want only today, or yesterday + today.
3. Click **Apply**.

If From is after To, the app swaps them.

#### The four numbers at the top

Using **today only** after this story:

| Card | What it counts | Example |
|---|---|---|
| **Sales** | Completed tickets in the dates | 29.00 MAD |
| **Tickets** | How many tickets | 1 |
| **Profit estimate** | (sale price − **current** cost) × qty sold | 2 × (8 − 5.50) + 1 × (13 − 9) = 5 + 4 = **9.00 MAD** |
| **Purchases** | Received deliveries in the dates (by purchase date) | 12 × 5.50 + 8 × 9.00 = **138.00 MAD** |

Profit is an **estimate**. It uses the cost on the product **today**, not “what the truck cost the day you received it.” If you later change cost from 5.50 to 6, old tickets still use 6 in this estimate.

The broken bottle is **not** in profit. You already paid for it; you did not sell it.

#### The four tables

**Sales by day**

| Day | Tickets | Total |
|---|---|---|
| 2026-08-23 | 1 | 29.00 MAD |

If you sell again tomorrow, a second row appears.

**Purchases by supplier**

| Supplier | Deliveries | Total |
|---|---|---|
| Coca-Cola Distribution | 2 | 138.00 MAD |

Only **received** deliveries. Drafts do not count.

**Cash sessions**

| Opened | Cashier | Status | Opening | Expected | Counted | Difference |
|---|---|---|---|---|---|---|
| this morning | Owner | open (until you close) | 200 | 229 after the sale | — until close | — |

After you close (next step), Expected **229**, Counted whatever you typed, Difference = counted − 229.

**Stock movements**

Last 30 lines in that date range, **all products** mixed:

| When | Product | Type | Qty | Reason | Who |
|---|---|---|---|---|---|
| afternoon | Coca-Cola 1L | adjustment / out | 1 | Broke a bottle | Owner |
| after Pay | Coca-Cola 2L | sale / out | 1 | sale | Owner |
| after Pay | Coca-Cola 1L | sale / out | 2 | sale | Owner |
| morning | Coca-Cola 2L | purchase / in | 8 | purchase | Owner |
| morning | Coca-Cola 1L | purchase / in | 12 | purchase | Owner |

This is the same diary as Stock → History, but for the whole shop and a date range. History is one product. Reports is the period.

---

### 10. Evening — close the caisse

All day, cash sales stay in the drawer.

The app does **not** count your coins. It **calculates** what should be there:

**Expected = opening amount + completed sales totals**

After our one sale (the broken bottle does not change cash):

- Opening: **200**
- Sales: **29** (the 50 the customer gave, minus the 21 you gave as change, leaves 29)
- **Expected = 229**

Evening: dump the drawer on the table. Count every note and coin. Type that as **Counted cash**. Then **Close caisse**.

| You type | Meaning | Difference |
|---|---|---|
| **229** | Drawer matches the math | **0** — perfect |
| **230** | 1 MAD extra | **+1** — over |
| **228** | 1 MAD short | **−1** — missing |

**Difference = counted − expected**

After close:

- Status **Closed**
- Row under **Recent sessions**
- **POS is blocked** until someone opens a **new** caisse tomorrow

Tomorrow you open again with whatever is actually in the drawer that morning (200 again, or 0, or 150). That is a **new** opening amount. Yesterday’s 200 belongs to yesterday’s closed session.

Open **Reports** again after close. The cash-sessions table now shows counted and difference.

---

### 11. Night — settings (only when you need them)

Sidebar **Settings**. Not every day.

- **Shop name** — sidebar + receipt (demo: Mini market)
- **Phone / address** — receipt
- **Currency** — dashboard and reports (usually MAD)
- **Ticket footer** — last line on the receipt (demo: Thank you)
- **Highlight low stock** — red warning on / off

Save. The sidebar name updates on the next page.

---

### 12. Night — log out

Footer **Log out**.

The next person sees Login. If they are the cashier, they only get Dashboard, POS, Caisse. They must open **their** caisse in the morning. Each person has their own drawer session.

---

## Categories, suppliers, products (the dictionary)

You write these **once**. After that you mostly scan.

### Categories

Shelf labels: Drinks, Food, Cleaning.

- Create a name.
- Edit the name.
- Active / Disabled = everyday delete.

### Suppliers

The company that sends the truck. Name, phone, address, notes. Same Active / Disabled.

### Products

One thing you sell, **one barcode**.

- All Coca-Cola **1L** bottles share `6110000000017`. Same product.
- Coca-Cola **2L** is a **different** product: `6110000000024`.

Create a product:

1. **Products** → create.
2. Barcode box: type or scan, **Enter**.
3. Name: Coca-Cola 1L.
4. Category: Drinks.
5. **Cost price**: what you pay the supplier (5.50).
6. **Sale price**: what the customer pays (8). POS always uses this. The cashier cannot invent a price.
7. **Starting stock**: only when you **create**. After that, stock moves through purchases, sales, and Stock adjust. Starting stock also writes a movement (Opening stock).
8. **Min stock**: “paint red when I have this many or fewer.”
9. **Unit**: piece (one bottle).
10. Save.

Search the list by **name or barcode**. Filter Active / Disabled / low stock.

If you “delete” a product, you **uncheck Active**. POS will not sell it. The row stays.

On Purchases, unknown barcodes can open “create product now.” On POS, unknown barcodes only show **Product not found**.

One barcode = one product. A pack of 6 is not a second barcode. The owner types quantity **6**.

---

## Small rules that save confusion

- **Cart is not saved** until Pay. Do not refresh POS in the middle of a ticket.
- **No discount** in this version.
- **No cancel sale** in this version. A wrong sale does not put stock back by itself.
- **Disabled** (`is_active` off) = hidden from selling / login. The row stays.
- **Stock movements** are written on receive, sell, opening stock, and adjust. See them on **Stock → History** (one product) or **Reports** (a date range).
- Red stock = **this product’s** stock ≤ **this product’s** min. 1L min 12. 2L min 8. Not “everything under 10.”
- Adjust is not a sale. Reason is required.

---

## How the milestones map to this story

| Milestone | In human words | Can you click it? |
|---|---|---|
| **1** | The shop program exists (Laravel + screens + SQLite). | Yes. |
| **2** | Username login. Owner and cashier. Owner creates users. | Yes. |
| **3** | Demo Coke, categories, supplier. | Yes — seed. |
| **4** | Create categories, suppliers, products, scan barcodes. | Yes. |
| **5** | The truck. Receive → stock up. | Yes. |
| **6** | Open drawer, sell, receipt, close drawer, stock down. | Yes. |
| **7** | Dashboard, Stock history, adjust, reports, settings. | Yes. |
| **8** | Install on the real shop PC, real USB scanner. | Not yet. |

---

## Demo cheat sheet

```text
Login:     owner / password

1L barcode: 6110000000017    cost 5.50    sale 8    min 12
2L barcode: 6110000000024    cost 9.00    sale 13   min 8

Morning truck:   12 × 1L and 8 × 2L
Open drawer:     200 MAD (change money)

Test ticket:     2×1L + 1×2L = 29 MAD
Customer pays:   50
Change:          21
After Pay:       1L = 10, 2L = 7   (both low vs min)

Broke a bottle:  Stock → 1L History → Out 1 → "Broke a bottle"
After adjust:    1L = 9

Expected close:  200 + 29 = 229
Profit estimate: 2×(8−5.50) + 1×(13−9) = 9 MAD
```

Scanner = type the barcode + **Enter**.
