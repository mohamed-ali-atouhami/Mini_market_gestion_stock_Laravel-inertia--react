<?php

use App\Models\CustomerReturn;
use App\Models\StockMovement;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $movements = DB::table('stock_movements')
            ->where('type', StockMovement::TYPE_RETURN)
            ->where('reason', 'replacement')
            ->get(['id', 'product_id', 'reference_type', 'reference_id']);

        foreach ($movements as $movement) {
            if ($movement->reference_type !== 'CustomerReturn' || $movement->reference_id === null) {
                continue;
            }

            $item = DB::table('customer_return_items')
                ->where('customer_return_id', $movement->reference_id)
                ->where('action', CustomerReturn::ACTION_REPLACE)
                ->where('replacement_product_id', $movement->product_id)
                ->first();

            if ($item === null) {
                $item = DB::table('customer_return_items')
                    ->where('customer_return_id', $movement->reference_id)
                    ->where('action', CustomerReturn::ACTION_REPLACE)
                    ->first();
            }

            if ($item === null) {
                continue;
            }

            $name = DB::table('products')->where('id', $item->returned_product_id)->value('name');

            if (! is_string($name) || $name === '') {
                continue;
            }

            DB::table('stock_movements')
                ->where('id', $movement->id)
                ->update(['reason' => 'replacement for '.$name]);
        }
    }

    public function down(): void
    {
        // Keep the filled-in product names. Rolling this back would also hide new replacements.
    }
};
