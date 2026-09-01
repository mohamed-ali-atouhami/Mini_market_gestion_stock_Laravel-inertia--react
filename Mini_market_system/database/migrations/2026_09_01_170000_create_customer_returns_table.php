<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_returns', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('cash_session_id')->constrained('cash_sessions');
            $table->decimal('cash_delta', 12, 2);
            $table->decimal('amount_paid', 12, 2)->nullable();
            $table->decimal('change_amount', 12, 2)->nullable();
            $table->string('reason')->nullable();
            $table->timestamps();
        });

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

    public function down(): void
    {
        Schema::dropIfExists('customer_return_items');
        Schema::dropIfExists('customer_returns');
    }
};
