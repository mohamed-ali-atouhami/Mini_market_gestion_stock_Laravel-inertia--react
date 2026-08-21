# How the mini market app works

**Last updated:** 21 August 2026 (Milestones 1–6). Milestone 7 is not built yet — when it works, we add a new chapter here.

This file is the simple story of the **shop**, not the programmer roadmap.  
If you want build order and checkboxes, read `docs/ROADMAP.md`.

Read it like someone is sitting next to you and pointing at the screen.

---

## What this app is (one sentence)

It is a notebook for one small shop: it remembers **what you have**, **when bottles come in**, **when a customer buys**, and **how much cash is in the drawer**.

---

## The one idea you must never forget

Imagine the shop is a big box of bottles.

- A **truck** arrives → bottles go **into** the box. That is a **purchase**. Stock goes **up**.
- A **customer** buys → bottles leave the box. That is a **sale**. Stock goes **down**.

The number on the product (stock) is “how many are in the box right now.”

You cannot sell what is not in the box.  
You do not type a new stock number by hand after the shop is running. Stock only moves when you **receive a delivery** or **pay on POS**.

---

## Two people

There are only two kinds of login.

### Owner (the boss)

Login for the demo: username **`owner`**, password **`password`**.

The owner can see **everything**: users, categories, suppliers, products, purchases, sales, POS, caisse.

The owner is the person who:

- creates the cashier
- creates products the first time
- receives the truck
- can also open the caisse and sell (for testing, the owner can do the cashier’s job too)

### Cashier (the person at the till)

The cashier only needs **POS** and **Caisse**.

The cashier **cannot**:

- create users
- change sale prices
- receive purchases (the truck)
- disable / “delete” products
- open the Sales list (they still see the receipt right after they sell)

There is **no cashier in the seed**. The first time, you log in as owner. If you want a cashier, the owner creates one under **Users**.

There is **no public Register** page. Nobody on the internet can create an account. Only the owner creates users.

---

## How to start the app (developer PC)

You need two terminals, both inside the folder `Mini_market_system`:

1. `php artisan serve` — the PHP app (usually http://127.0.0.1:8000)
2. `npm run dev` — the React pages (Vite)

Open the browser on http://127.0.0.1:8000  
If you are not logged in, you go to **Login**. If you already are, you go to **Dashboard**.

You do **not** need a real barcode scanner to test. The cheap USB scanner only **types the numbers and presses Enter**. Until you buy one, you type the barcode yourself and press **Enter**. Same thing.

---

## Login (Milestone 2)

1. Open the app.
2. Type username **`owner`**.
3. Type password **`password`**.
4. Click login.

You are now the boss. Look at the **sidebar** on the left. Those are the rooms of the shop.

| Sidebar name | Who sees it | What it is |
|---|---|---|
| Dashboard | Owner and cashier | Home. Reports come later (Milestone 7). |
| POS | Owner and cashier | The till. Scan. Pay. |
| Caisse | Owner and cashier | Open / close the cash drawer. |
| Users | Owner only | Create cashier / disable accounts. |
| Categories | Owner only | Drinks, Food, Cleaning… |
| Suppliers | Owner only | Who the truck belongs to. |
| Products | Owner only | Each bottle: barcode, prices, stock. |
| Purchases | Owner only | The truck arrives. Stock goes up. |
| Sales | Owner only | List of tickets after customers paid. |

Click the user area / logout when you are done.

---

## What already exists when you first run it (Milestone 3)

The database is not empty. A **seed** put demo shop data in for you.

### Categories

- Drinks
- Food
- Cleaning

### One supplier

- **Coca-Cola Distribution**
- Phone `0522000000`
- Address Casablanca

### Two products (stock starts at **0**)

| Product | Barcode (type this + Enter) | You buy it for | You sell it for | Warn if stock below |
|---|---|---|---|---|
| Coca-Cola 1L | `6110000000017` | 5.50 MAD | **8 MAD** | 12 |
| Coca-Cola 2L | `6110000000024` | 9.00 MAD | **13 MAD** | 8 |

**Very important:** stock is **0** until you receive a purchase. If you go to POS first, the sale will fail: not enough stock.

Money in this app is **MAD** (dirhams). Payments are **cash only**. No card. No discount in V1.

---

## Categories, suppliers, products (Milestone 4)

This is the “dictionary” of the shop. You write things **once**. After that you mostly scan.

### Categories

Think of a shelf label: Drinks, Food, Cleaning.

- **Create** a category (name).
- **Edit** the name.
- **Active / Disabled**: this is everyday “delete.” The row stays. You hide it. You can turn it back on.

We do **not** throw the row in the trash. Old tickets still need to know “this was a Drink.”

### Suppliers

The company that sends the truck.

Name, phone, address, notes. Same Active / Disabled idea.

### Products

A product is **one thing you sell**, with **one barcode**.

Example:

- All Coca-Cola **1L** bottles share barcode `6110000000017`. They are the same product.
- Coca-Cola **2L** is a **different** product with a **different** barcode `6110000000024`.

The first time you meet a bottle, you teach the app:

1. Open **Products** → create.
2. Click the barcode box (or scan). Type the code, press **Enter**. The numbers stay in the field.
3. Name: Coca-Cola 1L.
4. Category: Drinks.
5. **Cost price**: what **you** pay the supplier (example 5.50).
6. **Sale price**: what the **customer** pays (example 8). POS always uses this number from the database. The cashier cannot invent a price.
7. **Starting stock**: only when you **create** a product. After that, stock changes through purchases and sales.
8. **Min stock**: “warn me when I have fewer than this.” (The red warning screen is Milestone 7.)
9. **Unit**: piece (one bottle).
10. Save.

On the product list you can search by **name or barcode**, filter, see Active / Disabled.

If you “delete” a product in V1, you **uncheck Active**. POS will not sell it. The row is still there.

**Scanner rule:** the USB gun is a fake keyboard. It types `6110000000017` and hits Enter. On Purchases, unknown barcodes can open “create product now.” On POS, unknown barcodes only show **Product not found**. A cashier must not create products.

---

## Purchases — the truck (Milestone 5)

This is how bottles **enter** the shop.

### Why you must do this before POS

Demo Coca-Cola starts at 0. The box is empty. POS cannot sell empty air.

### How a delivery works (click by click)

1. Sidebar **Purchases** → **New delivery**.
2. Pick the **supplier** (Coca-Cola Distribution).
3. Date is today unless you change it. Invoice number is optional.
4. Click **Scan barcode**.
5. Type `6110000000017` and press **Enter**.
6. A line appears: Coca-Cola 1L, quantity **1**, cost from the product.
7. Change quantity to **12** (you received 12 bottles, not 1).
8. Click **Receive**.

What the app does in one step (all or nothing):

- saves the purchase paper
- stock of 1L goes from **0 → 12**
- writes a **stock movement**: “12 came in”

If something fails, it saves **nothing**. Stock does not move halfway.

Do the same for 2L: new delivery, scan `6110000000024`, qty **8**, **Receive**. Stock of 2L: **0 → 8**.

### Draft vs Receive vs Cancel

- **Save draft**: you started the paper but the boxes are still on the truck. Stock does **not** go up yet.
- **Receive**: the boxes are on the shelf. Stock **goes up**.
- **Cancel draft**: throw the unfinished paper away. (You cannot cancel a received delivery in the simple V1 flow.)

### Unknown barcode on Purchases

If you scan a code the app never saw, a window can appear: **create this product now**, with the barcode already filled. That is for the **owner**. After you save the product, you continue the delivery.

### Who can receive?

**Owner only.** A cashier must not receive the truck. That is a shop rule, not a suggestion.

---

## Caisse — the cash drawer (Milestone 6, part 1)

POS is the **selling screen**.  
Caisse is the **drawer of money**.

You **must open the caisse before you sell**. If the drawer is closed, POS sends you back to Caisse with a message like “Open the caisse before selling.”

One person can have only **one open caisse** at a time. Close it before opening a new one.

### What is the opening amount? (the number 200)

**200 is not a sale. It is not Coca-Cola. It is not profit.**

It is the cash **already sitting in the drawer when you start the day**, so you can give change.

Story:

A customer will pay **50 MAD** for something that costs **29 MAD**. You must give **21 MAD** back. If the drawer is empty, you cannot give change.

So in the morning you put notes and coins in the till. That pile is the **opening amount**.

In the test we type **200** as a made-up number, meaning:

> “This morning I put 200 MAD in the caisse.”

You could type **0** if the drawer is empty, or **100**, or **350**. The app only remembers: *this is how much was there at open.*

### How to open (click by click)

1. Sidebar **Caisse**.
2. **Opening amount**: type `200`.
3. Click **Open caisse**.
4. You should see badge **Open**, Opening **200**, Sales **0**, Expected **200**.
5. Click **Go to POS** (or sidebar **POS**).

If Open caisse does nothing, refresh the page. The button must submit the form. After a successful open, the screen **changes**: you no longer see the opening box; you see Open + Close.

---

## POS — selling to a customer (Milestone 6, part 2)

This is the till.

The cart lives **only on this screen** until you click **Pay**. If you leave POS before paying, the cart is gone. Nothing was sold. Stock did not move.

### Demo sale (the numbers we use)

We sell:

- Coca-Cola 1L × **2** → 2 × 8 = **16 MAD**
- Coca-Cola 2L × **1** → 1 × 13 = **13 MAD**
- **Total = 29 MAD**

Customer pays **50**. Change = 50 − 29 = **21 MAD**.

(Old notes sometimes said change 23. That was a different fake price. **In this app the total is 29, change is 21.**)

### Click by click

1. Caisse is already **Open**.
2. Sidebar **POS**.
3. Click **Scan barcode** if needed.
4. Type `6110000000017` + **Enter**. Line: Coca-Cola 1L, qty 1, price 8.
5. Same code + **Enter** again. Qty becomes **2**. Subtotal 16.
6. Type `6110000000024` + **Enter**. Coca-Cola 2L, qty 1, price 13.
7. Screen says **Total: 29.00 MAD**.
8. **Amount paid**: type `50`. **Change** should show **21.00**.
9. Click **Pay**.

You go to a **receipt**: shop name, lines, total 29, paid 50, change 21.

- **Print** = the browser print dialog (no thermal printer yet).
- **New sale** = empty cart, back to POS.

Then open **Products**:

- 1L was 12, now **10**
- 2L was 8, now **7**

That is stock **out**. Same idea as the truck, but backwards.

### What Pay actually does (in one breath)

All of this together, or nothing:

1. Check the caisse is still open.
2. Check each product is active.
3. Check there is enough stock.
4. Save the ticket (`SAL-2026-0001` style).
5. Save each line.
6. Decrease stock.
7. Write stock movements “went out.”
8. Show the receipt.

Prices come from the **database**, not from what the cashier typed in the cart.

### If something is wrong

| What you try | What should happen |
|---|---|
| POS while caisse is closed | You land on Caisse. Open first. |
| Scan a code that does not exist | Toast: Product not found. No create popup. |
| Qty 20 when stock is 10 | Not enough stock. Stock stays 10. No ticket. |
| Amount paid `20` when total is 29 | Error: paid less than the total. |
| Inactive product | Cannot sell it. |
| Open caisse twice | Close the current one first. |

---

## Sales list (owner only)

After Pay, the owner can also go to sidebar **Sales**.

You see the ticket `SAL-….` Open the eye. Same numbers. **Receipt** opens the printable page again.

The cashier does **not** get this menu. Their receipt is the page right after Pay.

---

## Close the caisse — end of the day (Milestone 6, part 3)

All day, cash sales stay in the drawer.

The app does **not** count your coins. It **calculates** what *should* be there:

**Expected in drawer = opening amount + completed sales totals**

After our one demo sale:

- Opening: **200**
- Sales: **29** (the 50 the customer gave, minus the 21 you gave as change, leaves 29)
- **Expected = 229**

### Counted cash

Evening: you dump the drawer on the table and count every note and coin. That real total is **Counted cash**. You type it, then **Close caisse**.

| You type | Meaning | Difference |
|---|---|---|
| **229** | Drawer matches the math | **0** — perfect |
| **230** | You found 1 MAD extra | **+1** — over |
| **228** | You are 1 MAD short | **−1** — missing |

**Difference = counted − expected**

- Positive: more cash than the computer expected  
- Negative: less cash than the computer expected  
- Zero: it matches  

After close:

- Status **Closed**
- Row appears under **Recent sessions**
- **POS is blocked** until someone opens a **new** caisse (next morning)

Tomorrow you open again with whatever is actually in the drawer that morning (maybe 200 again, maybe 0, maybe 150). That new number is a **new** opening amount. The old 200 belongs to yesterday’s closed session.

---

## Full day A to Z (put it all together)

Do this once on the demo so you feel the shop.

### Morning — stock (if shelves are empty)

1. Login `owner` / `password`.
2. **Purchases** → New delivery → supplier Coca-Cola Distribution.
3. Scan `6110000000017`, qty `12`, **Receive**.
4. New delivery. Scan `6110000000024`, qty `8`, **Receive**.
5. **Products**: 1L = 12, 2L = 8.

### Morning — money in the drawer

6. **Caisse** → opening `200` → **Open caisse**.

### Day — customers

7. **POS** → scan 1L twice, 2L once → total 29 → paid 50 → **Pay**.
8. Receipt: change 21. Print if you want. **New sale** for the next customer.
9. **Products**: 1L = 10, 2L = 7.
10. **Sales**: one ticket (owner).

### Evening — count the drawer

11. **Caisse**: Sales 29, Expected 229.
12. Counted cash `229` (or `230` to see a difference of 1).
13. **Close caisse**.
14. POS will refuse until you open again.

That is the whole V1 selling day: **receive → open drawer → sell → close drawer**.

---

## Small rules that save confusion

- **Cart is not saved** until Pay. Do not refresh POS in the middle of a ticket.
- **No discount** in this version.
- **No cancel sale** in this version. If you sold by mistake, that is later work. Stock does not come back by itself.
- **Disabled** (`is_active` off) = hidden from selling / login, but the row stays.
- **Stock movements** already get written when you receive or sell. The nice **history screen** for the owner is Milestone 7.
- One barcode = one product. A pack of 6 is not a second barcode in V1. The owner types quantity **6**.

---

## How the milestones map to this story

| Milestone | In human words | Can you click it? |
|---|---|---|
| **1** | The shop computer program exists (Laravel + screens + SQLite). | Yes — app runs. |
| **2** | Username login. Owner and cashier. Owner creates users. | Yes. |
| **3** | Empty shelves in the database, plus demo Coke and categories. | Yes — seed data. |
| **4** | You can create categories, suppliers, products, scan barcodes. | Yes. |
| **5** | The truck. Receive → stock up. | Yes. |
| **6** | Open drawer, sell, receipt, close drawer, stock down. | Yes. |
| **7** | Dashboard numbers, movement history, reports, settings, damage/count adjustments. | **Not yet.** |
| **8** | Install on the real shop PC, real USB scanner. | Not yet. |

---

## Milestone 7 — not in the app yet

When Milestone 7 works, **update this chapter**. Until then, this is only a promise:

The owner will be able to see, without opening every ticket:

- how much we sold **today** and how many tickets
- which products are **low stock** (below min stock)
- a list of **stock movements** (in from truck, out from sale, later: damage / count)
- simple **reports** (sales by day, purchases by supplier, cash sessions)
- **settings**: shop name, phone, address, ticket footer
- **manual stock adjust** (broke a bottle, counted the shelf wrong) — still through the same stock engine, with a reason

Do not look for those screens now. They are not built.

---

## Demo cheat sheet (keep this)

```text
Login:     owner / password

1L barcode: 6110000000017    sale 8 MAD
2L barcode: 6110000000024    sale 13 MAD

Test ticket:  2×1L + 1×2L = 29 MAD
Customer pays: 50
Change:        21

Test drawer:  open 200
After sale:   expected 229
```

Scanner = type the barcode + **Enter**.
