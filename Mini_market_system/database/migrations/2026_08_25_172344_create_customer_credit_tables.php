<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone');
            $table->string('phone_normalized')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->string('payment_method')->default('cash');
            $table->foreignId('customer_id')->nullable()->constrained('customers');
            $table->date('due_date')->nullable();
            $table->decimal('remaining_amount', 12, 2)->default(0);
        });

        Schema::create('credit_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('cash_session_id')->constrained('cash_sessions');
            $table->decimal('amount', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_payments');

        Schema::table('sales', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_id');
            $table->dropColumn(['payment_method', 'due_date', 'remaining_amount']);
        });

        Schema::dropIfExists('customers');
    }
};
