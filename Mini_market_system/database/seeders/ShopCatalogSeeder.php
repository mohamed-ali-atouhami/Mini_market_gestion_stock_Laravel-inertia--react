<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ShopCatalogSeeder extends Seeder
{
    /**
     * Replace the test catalog with the shop spreadsheet.
     * Sale price and min stock come from the file. Cost and stock are random
     * test numbers. Run with: php artisan db:seed --class=ShopCatalogSeeder
     */
    public function run(): void
    {
        foreach (['sales', 'purchases', 'customer_returns'] as $table) {
            if (Schema::hasTable($table) && DB::table($table)->count() > 0) {
                $this->command?->error("Stopped. {$table} already has rows, so the old products were left in place.");

                return;
            }
        }

        $path = database_path('data/shop_products.json');
        $rows = json_decode((string) file_get_contents($path), true);
        if (! is_array($rows) || $rows === []) {
            $this->command?->error('The product file is empty.');

            return;
        }

        DB::transaction(function () use ($rows): void {
            if (Schema::hasTable('customer_return_items')) {
                DB::table('customer_return_items')->delete();
            }
            DB::table('stock_movements')->delete();
            DB::table('sale_items')->delete();
            DB::table('purchase_items')->delete();
            DB::table('products')->delete();
            DB::table('categories')->delete();

            $categories = [];

            foreach ($rows as $row) {
                $categoryName = $row['category'];
                if (! isset($categories[$categoryName])) {
                    $categories[$categoryName] = Category::query()->create([
                        'name' => $categoryName,
                        'is_active' => true,
                    ]);
                }

                $salePrice = round((float) $row['sale_price'], 2);
                $costRate = random_int(50, 80) / 100;

                Product::query()->create([
                    'category_id' => $categories[$categoryName]->id,
                    'name' => $row['name'],
                    'barcode' => $row['barcode'],
                    'image_path' => ! empty($row['image'])
                        ? 'products/'.$row['barcode'].'.jpg'
                        : null,
                    'cost_price' => round($salePrice * $costRate, 2),
                    'sale_price' => $salePrice,
                    'stock_quantity' => random_int(0, 40),
                    'min_stock' => $row['min_stock'],
                    'unit' => Product::UNIT_PIECE,
                    'is_active' => true,
                ]);
            }
        });

        $this->command?->info('Imported '.count($rows).' products into '.Category::query()->count().' categories.');
    }
}
