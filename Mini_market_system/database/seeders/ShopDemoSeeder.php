<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class ShopDemoSeeder extends Seeder
{
    /**
     * Sample shop data: categories, one supplier, Coca-Cola 1L / 2L.
     */
    public function run(): void
    {
        $drinks = Category::query()->firstOrCreate(
            ['name' => 'Drinks'],
            ['is_active' => true],
        );

        Category::query()->firstOrCreate(
            ['name' => 'Food'],
            ['is_active' => true],
        );

        Category::query()->firstOrCreate(
            ['name' => 'Cleaning'],
            ['is_active' => true],
        );

        Supplier::query()->firstOrCreate(
            ['name' => 'Coca-Cola Distribution'],
            [
                'phone' => '0522000000',
                'address' => 'Casablanca',
                'notes' => 'Pays on Friday',
                'is_active' => true,
            ],
        );

        Product::query()->firstOrCreate(
            ['barcode' => '6110000000017'],
            [
                'category_id' => $drinks->id,
                'name' => 'Coca-Cola 1L',
                'cost_price' => 5.50,
                'sale_price' => 8.00,
                'stock_quantity' => 0,
                'min_stock' => 12,
                'unit' => Product::UNIT_PIECE,
                'is_active' => true,
            ],
        );

        Product::query()->firstOrCreate(
            ['barcode' => '6110000000024'],
            [
                'category_id' => $drinks->id,
                'name' => 'Coca-Cola 2L',
                'cost_price' => 9.00,
                'sale_price' => 13.00,
                'stock_quantity' => 0,
                'min_stock' => 8,
                'unit' => Product::UNIT_PIECE,
                'is_active' => true,
            ],
        );

        Setting::query()->updateOrCreate(
            ['id' => 1],
            [
                'shop_name' => 'Mini market',
                'shop_phone' => null,
                'shop_address' => null,
                'currency' => 'MAD',
                'ticket_footer' => 'Thank you',
                'low_stock_enabled' => true,
            ],
        );
    }
}
