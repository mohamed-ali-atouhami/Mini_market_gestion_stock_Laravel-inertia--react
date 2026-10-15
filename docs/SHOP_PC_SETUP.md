# Install Mini market on a shop PC

Use this when the shop PC is new and has no programming tools. The shop runs from a desktop icon. The database is the file `database\database.sqlite`.

Install **PHP only**. Do not install XAMPP, Laragon, Node, Git, Composer, or MySQL on the shop PC. Those are for the computer where the code is written.

Edge is already on Windows and is enough. Install Chrome only if the shop window should use Chrome. The icon uses Chrome when Chrome is installed, and Edge otherwise.

Do the work in this order:

1. On the coding PC, build the screen and share the folder.
2. On the shop PC, install PHP.
3. Copy the folder over Wi-Fi.
4. Create the desktop icon.

After real sales exist on a shop PC, never run `php artisan migrate:fresh` there.

---

## Part 1 — On the coding PC

### 1.1 Build the screen

Open PowerShell:

```powershell
cd C:\stock_management_system\Mini_market_system
npm run build
```

Wait until it finishes. This file must exist:

`Mini_market_system\public\build\manifest.json`

If `public\hot` exists, delete that file. It belongs to a coding session and must not go to the shop PC.

### 1.2 Make Wi-Fi private

1. Open **Settings → Network & Internet → Wi-Fi**.
2. Click the connected Wi-Fi name.
3. Set the network profile to **Private**.

### 1.3 Turn on sharing

1. Press the Windows key and type `Manage advanced sharing settings`.
2. Open it.
3. Under **Private**, turn on **Network discovery**.
4. Turn on **File and printer sharing**.
5. Under **All Networks**, turn on **Password protected sharing**.
6. Click **Save changes**.

### 1.4 Allow sharing through the firewall

1. Press the Windows key and type `firewall`.
2. Open **Windows Defender Firewall**.
3. Click **Allow an app or feature through Windows Defender Firewall**.
4. Click **Change settings**.
5. Find **File and Printer Sharing**. On a French Windows menu it is **Partage de fichiers et d'imprimantes**.
6. Check **Private**.
7. Click **OK**.

### 1.5 Share the shop folder

1. Press the Windows key, type `powershell`, right-click **Windows PowerShell**, and choose **Run as administrator**.
2. Paste this and press Enter:

```powershell
New-SmbShare -Name "MiniMarket" -Path "C:\stock_management_system\Mini_market_system" -ReadAccess "Everyone"
```

A table with the name `MiniMarket` means the share exists.

### 1.6 Write down the address and the Windows account

In a normal PowerShell window on the coding PC:

```powershell
hostname
whoami
ipconfig
```

- `hostname` is the PC name, for example `DESKTOP-JJAFAQO`.
- `whoami` looks like `DESKTOP-JJAFAQO\hp ultrabook`. The part after the backslash is the username.
- In `ipconfig`, use the **IPv4 Address** on the **Wi-Fi** adapter. It looks like `192.168.1.7`. Ignore addresses that start with `169.254`.

The password for the share is the Windows sign-in password of that user on the coding PC. A PIN does not work. The shop login `password` does not work. The Wi-Fi password does not work.

---

## Part 2 — On the shop PC: install PHP

### 2.1 Install the Microsoft library PHP needs

PHP will not start without this. You never open it again after the installer finishes.

1. Open [https://windows.php.net/download/](https://windows.php.net/download/).
2. Click the link for the **Visual C++ Redistributable** (x64).
3. Run the installer. If it says the library is already installed, close it and continue.

### 2.2 Download PHP 8.4

The main download page shows only the newest PHP (8.5). This shop uses **PHP 8.4**.

1. Open [https://www.php.net/downloads.php?os=windows&osvariant=windows-downloads&version=8.4](https://www.php.net/downloads.php?os=windows&osvariant=windows-downloads&version=8.4).
2. Under **PHP 8.4**, find **VS17 x64 Non Thread Safe**.
3. Download the **Zip** (about 33 MB).
4. Do not download Thread Safe, x86, the Debug Pack, or the Development package.

### 2.3 Put PHP in `C:\php`

1. Open `C:\` and create a folder named `php`.
2. Open the zip.
3. Copy everything inside the zip into `C:\php`.
4. Confirm this file exists: `C:\php\php.exe`.

### 2.4 Turn on the pieces Laravel needs

1. In `C:\php`, copy `php.ini-production` and rename the copy to `php.ini`.
2. Open `php.ini` with Notepad.
3. Remove the semicolon at the start of each of these lines:

```ini
extension_dir = "ext"
extension=curl
extension=fileinfo
extension=gd
extension=mbstring
extension=openssl
extension=pdo_sqlite
extension=sqlite3
```

4. Set the timezone:

```ini
date.timezone = Africa/Casablanca
```

5. Save and close Notepad.

There is no `extension=bcmath` line in PHP 8.4. Bcmath is already built in. Leave `bcmath.scale = 0` as it is.

### 2.5 Let Windows find `php`

1. Press the Windows key and type `environment`.
2. Open **Edit the system environment variables**.
3. Click **Environment Variables**.
4. Under **System variables**, select **Path**, then **Edit**.
5. Click **New** and type `C:\php`.
6. Click OK on every window.
7. Sign out of Windows and sign back in.

### 2.6 Prove PHP works

Open PowerShell:

```powershell
php -v
```

The first line must say PHP 8.4. If Windows says `php` is not recognized, Path is wrong or you have not signed out yet.

Then run:

```powershell
php -m
```

The list must include `bcmath`, `curl`, `fileinfo`, `gd`, `mbstring`, `openssl`, `pdo_sqlite`, and `sqlite3`. If one is missing, that line in `php.ini` is still commented out. Fix it, save, and run `php -m` again.

---

## Part 3 — Copy the shop over Wi-Fi

Both PCs must be on the same Wi-Fi. A normal Type-C cable between two PCs does not copy files.

On the **shop** PC:

1. Open File Explorer.
2. Click the address bar.
3. Type the Wi-Fi address from Part 1 and press Enter:

```text
\\192.168.1.7\MiniMarket
```

Use the IPv4 address from the coding PC. `192.168.1.7` is only an example.

4. When Windows asks for a name and password:
   - **Username:** the name from `whoami`, for example `hp ultrabook`
   - **Password:** the Windows sign-in password of the coding PC

If the username is refused, type it as `DESKTOP-JJAFAQO\hp ultrabook` using the real PC name and the real username.

`Windows cannot access \\...` means the firewall or the share on the coding PC is still closed. Repeat Part 1.4 and Part 1.5, then try the IPv4 address again. Do not use a `169.254` address.

### What to copy

The window that opens is the inside of `Mini_market_system`.

1. On the shop PC, open `C:\`.
2. Create a folder named `MiniMarket`.
3. Inside it, create a folder named `Mini_market_system`.
4. Go back to the shared window.
5. Select everything **except** the folder `node_modules`.
6. Copy that into `C:\MiniMarket\Mini_market_system`.

`vendor` is large. Wait until File Explorer finishes.

These must exist when the copy is done:

- `C:\MiniMarket\Mini_market_system\artisan`
- `C:\MiniMarket\Mini_market_system\.env`
- `C:\MiniMarket\Mini_market_system\vendor`
- `C:\MiniMarket\Mini_market_system\public\build\manifest.json`
- `C:\MiniMarket\Mini_market_system\database\database.sqlite`
- `C:\MiniMarket\Mini_market_system\shop`

If `public\hot` was copied, delete that file.

The shop PC's `database.sqlite` becomes the real database after the first sale. Do not copy an old `database.sqlite` over it later.

---

## Part 4 — Finish the shop PC

### 4.1 Edit `.env`

Open `C:\MiniMarket\Mini_market_system\.env` in Notepad. Change only these three lines. Do not touch `APP_KEY`.

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=http://127.0.0.1:8000
```

Save and close Notepad.

### 4.2 Check Laravel

In PowerShell:

```powershell
cd C:\MiniMarket\Mini_market_system
php artisan --version
```

`Laravel Framework 12.66.0` means the copy is good.

A warning that says `proc_open(): CreateProcess failed ... sebastian\version\src\Version.php` means the copy includes a `.git` folder and Git is not installed. The shop does not need Git. Delete only this folder on the shop PC:

`C:\MiniMarket\Mini_market_system\.git`

Do not delete `.git` on the coding PC. Do not run `migrate:fresh`. Do not run `db:seed`.

### 4.3 Create the desktop icon

```powershell
powershell -ExecutionPolicy Bypass -File C:\MiniMarket\Mini_market_system\shop\create-desktop-shortcut.ps1
```

A shortcut named **Mini market** appears on the desktop.

1. Double-click **Mini market**.
2. If Windows asks whether PHP may use the network, click **Allow**.
3. The shop opens at `http://127.0.0.1:8000`.
4. Log in as `younes` with password `password`.

Closing the **Mini market** window stops the shop. Closing a normal browser tab does not.

If the folder on the shop PC is not named `Mini_market_system`, use the real folder name in the command above.

---

## Every morning

1. Turn on the PC.
2. Double-click **Mini market**.
3. Log in.
4. Open the caisse, then sell.

While the PC is plugged in, set sleep to **Never** so the till does not sleep during the day: **Settings → System → Power**.

---

## Scanner

Plug in the USB scanner. Windows treats it as a keyboard. Click the barcode box in Purchases or on the till, then scan. No driver install.

---

## Phone on the same Wi-Fi

The shop PC and the phone must be on the same Wi-Fi. The Mini market window must stay open. This does not work on 4G or on another Wi-Fi.

1. Start **Mini market**.
2. Open `C:\MiniMarket\Mini_market_system\shop\phone-url.txt`.
3. On the phone, type the `http://192.168...:8000` address from that file.
4. If the phone cannot open it, right-click `shop\enable-phone-access.ps1` and choose **Run with PowerShell** as Administrator, once.

---

## Backup

Once a week, with the Mini market window closed, copy this file to a USB stick or Drive:

`C:\MiniMarket\Mini_market_system\database\database.sqlite`

Closing the window does not delete sales. That copy is what saves the shop if the disk dies.
