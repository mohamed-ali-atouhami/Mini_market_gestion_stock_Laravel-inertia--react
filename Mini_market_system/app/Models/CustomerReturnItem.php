<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerReturnItem extends Model
{
    protected $fillable = [
        'customer_return_id',
        'action',
        'condition',
        'returned_product_id',
        'returned_quantity',
        'returned_unit_price',
        'returned_unit_cost',
        'returned_value',
        'replacement_product_id',
        'replacement_quantity',
        'replacement_unit_price',
        'replacement_unit_cost',
        'replacement_value',
        'supplier_id',
        'supplier_status',
        'given_by',
        'given_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'returned_quantity' => 'decimal:3',
            'returned_unit_price' => 'decimal:2',
            'returned_unit_cost' => 'decimal:2',
            'returned_value' => 'decimal:2',
            'replacement_quantity' => 'decimal:3',
            'replacement_unit_price' => 'decimal:2',
            'replacement_unit_cost' => 'decimal:2',
            'replacement_value' => 'decimal:2',
            'given_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<CustomerReturn, $this>
     */
    public function customerReturn(): BelongsTo
    {
        return $this->belongsTo(CustomerReturn::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function returnedProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'returned_product_id');
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function replacementProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'replacement_product_id');
    }

    /**
     * @return BelongsTo<Supplier, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function givenBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'given_by');
    }

    public function isWaitingForSupplier(): bool
    {
        return $this->supplier_status === CustomerReturn::SUPPLIER_WAITING;
    }
}
