<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_return_items', function (Blueprint $table) {
            $table->decimal('returned_unit_cost', 12, 2)->default(0);
            $table->decimal('replacement_unit_cost', 12, 2)->nullable();
        });

        foreach (DB::table('customer_return_items')->orderBy('id')->get() as $item) {
            $returnedCost = DB::table('products')
                ->where('id', $item->returned_product_id)
                ->value('cost_price');
            $replacementCost = $item->replacement_product_id
                ? DB::table('products')
                    ->where('id', $item->replacement_product_id)
                    ->value('cost_price')
                : null;

            DB::table('customer_return_items')->where('id', $item->id)->update([
                'returned_unit_cost' => $returnedCost ?? 0,
                'replacement_unit_cost' => $replacementCost,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('customer_return_items', function (Blueprint $table) {
            $table->dropColumn(['returned_unit_cost', 'replacement_unit_cost']);
        });
    }
};
