<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'name' => fake()->words(3, true),
            'barcode' => fake()->unique()->numerify('611##########'),
            'cost_price' => fake()->randomFloat(2, 2, 20),
            'sale_price' => fake()->randomFloat(2, 21, 40),
            'stock_quantity' => 0,
            'min_stock' => 6,
            'unit' => Product::UNIT_PIECE,
            'is_active' => true,
        ];
    }
}
