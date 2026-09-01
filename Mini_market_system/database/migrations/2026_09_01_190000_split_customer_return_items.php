<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('customer_return_items')) {
            Schema::create('customer_return_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('customer_return_id')->constrained('customer_returns')->cascadeOnDelete();
                $table->string('action');
                $table->string('condition');
                $table->foreignId('returned_product_id')->constrained('products');
                $table->decimal('returned_quantity', 12, 3);
                $table->decimal('returned_unit_price', 12, 2);
                $table->decimal('returned_value', 12, 2);
                $table->foreignId('replacement_product_id')->nullable()->constrained('products');
                $table->decimal('replacement_quantity', 12, 3)->nullable();
                $table->decimal('replacement_unit_price', 12, 2)->nullable();
                $table->decimal('replacement_value', 12, 2)->nullable();
                $table->foreignId('supplier_id')->nullable()->constrained('suppliers');
                $table->string('supplier_status');
                $table->foreignId('given_by')->nullable()->constrained('users');
                $table->dateTime('given_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasColumn('customer_returns', 'returned_product_id')) {
            return;
        }

        $now = now();

        foreach (DB::table('customer_returns')->orderBy('id')->get() as $row) {
            DB::table('customer_return_items')->insert([
                'customer_return_id' => $row->id,
                'action' => $row->action,
                'condition' => $row->condition,
                'returned_product_id' => $row->returned_product_id,
                'returned_quantity' => $row->returned_quantity,
                'returned_unit_price' => $row->returned_unit_price,
                'returned_value' => $row->returned_value,
                'replacement_product_id' => $row->replacement_product_id,
                'replacement_quantity' => $row->replacement_quantity,
                'replacement_unit_price' => $row->replacement_unit_price,
                'replacement_value' => $row->replacement_value,
                'supplier_id' => $row->supplier_id,
                'supplier_status' => $row->supplier_status,
                'given_by' => $row->given_by,
                'given_at' => $row->given_at,
                'created_at' => $row->created_at ?? $now,
                'updated_at' => $row->updated_at ?? $now,
            ]);
        }

        Schema::table('customer_returns', function (Blueprint $table) {
            $table->dropForeign(['returned_product_id']);
            $table->dropForeign(['replacement_product_id']);
            $table->dropForeign(['supplier_id']);
            $table->dropForeign(['given_by']);
            $table->dropColumn([
                'action',
                'condition',
                'returned_product_id',
                'returned_quantity',
                'returned_unit_price',
                'returned_value',
                'replacement_product_id',
                'replacement_quantity',
                'replacement_unit_price',
                'replacement_value',
                'supplier_id',
                'supplier_status',
                'given_by',
                'given_at',
            ]);
        });
    }

    public function down(): void
    {
        // Live shop data stays on the item table. Do not rebuild the old one-product columns.
    }
};
