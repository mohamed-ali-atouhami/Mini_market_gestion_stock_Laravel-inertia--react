<?php

use App\Http\Controllers\CashSessionController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $user = auth()->user();

    if (! $user) {
        return redirect()->route('login');
    }

    return redirect()->route($user->homeRouteName());
});

Route::middleware(['auth', 'active'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
    Route::get('/pos/lookup-product', [PosController::class, 'lookupProduct'])->name('pos.lookup-product');
    Route::post('/pos', [PosController::class, 'store'])->name('pos.store');

    Route::get('/caisse', [CashSessionController::class, 'index'])->name('caisse.index');
    Route::post('/caisse', [CashSessionController::class, 'store'])->name('caisse.open');
    Route::post('/caisse/{cashSession}/close', [CashSessionController::class, 'close'])->name('caisse.close');

    Route::get('/credits', [CreditController::class, 'index'])->name('credits.index');
    Route::post('/credits/{sale}/pay', [CreditController::class, 'storePayment'])->name('credits.pay');

    Route::get('/sales/{sale}/receipt', [SaleController::class, 'receipt'])->name('sales.receipt');

    Route::middleware('owner')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');

        Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::patch('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');

        Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
        Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
        Route::patch('/suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');

        Route::get('/products', [ProductController::class, 'index'])->name('products.index');
        Route::post('/products', [ProductController::class, 'store'])->name('products.store');
        Route::patch('/products/{product}', [ProductController::class, 'update'])->name('products.update');

        Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchases.index');
        Route::get('/purchases/create', [PurchaseController::class, 'create'])->name('purchases.create');
        Route::get('/purchases/lookup-product', [PurchaseController::class, 'lookupProduct'])->name('purchases.lookup-product');
        Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');
        Route::get('/purchases/{purchase}', [PurchaseController::class, 'show'])->name('purchases.show');
        Route::get('/purchases/{purchase}/edit', [PurchaseController::class, 'edit'])->name('purchases.edit');
        Route::patch('/purchases/{purchase}', [PurchaseController::class, 'update'])->name('purchases.update');
        Route::post('/purchases/{purchase}/receive', [PurchaseController::class, 'receive'])->name('purchases.receive');
        Route::post('/purchases/{purchase}/cancel', [PurchaseController::class, 'cancel'])->name('purchases.cancel');

        Route::get('/sales', [SaleController::class, 'index'])->name('sales.index');
        Route::get('/sales/{sale}', [SaleController::class, 'show'])->name('sales.show');

        Route::get('/stock', [StockController::class, 'index'])->name('stock.index');
        Route::get('/stock/{product}', [StockController::class, 'show'])->name('stock.show');
        Route::post('/stock/{product}/adjust', [StockController::class, 'adjust'])->name('stock.adjust');

        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

        Route::get('/settings', [SettingController::class, 'edit'])->name('settings.edit');
        Route::patch('/settings', [SettingController::class, 'update'])->name('settings.update');
    });
});

require __DIR__.'/auth.php';
