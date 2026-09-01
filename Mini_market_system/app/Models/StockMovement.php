<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StockMovement extends Model
{
    public const TYPE_PURCHASE = 'purchase';

    public const TYPE_SALE = 'sale';

    public const TYPE_ADJUSTMENT = 'adjustment';

    public const TYPE_RETURN = 'return';

    public const DIRECTION_IN = 'in';

    public const DIRECTION_OUT = 'out';

    public const UPDATED_AT = null;

    protected $fillable = [
        'product_id',
        'user_id',
        'type',
        'direction',
        'quantity',
        'quantity_before',
        'quantity_after',
        'reference_type',
        'reference_id',
        'reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'quantity_before' => 'decimal:3',
            'quantity_after' => 'decimal:3',
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    public function typeLabel(): string
    {
        $this->loadMissing('reference');

        if ($this->type === self::TYPE_SALE
            && $this->reference instanceof Sale
            && $this->reference->isCredit()) {
            return 'sale (credit)';
        }

        return $this->type;
    }

    public function reasonLabel(): string
    {
        $reason = (string) $this->reason;

        if ($reason !== 'replacement') {
            return $reason;
        }

        $this->loadMissing('reference');

        if (! $this->reference instanceof CustomerReturn) {
            return $reason;
        }

        $this->reference->loadMissing('items.returnedProduct');

        $item = $this->reference->items->first(
            fn (CustomerReturnItem $row) => (int) $row->replacement_product_id === (int) $this->product_id,
        ) ?? $this->reference->items->first();

        $name = $item?->returnedProduct?->name;

        return is_string($name) && $name !== ''
            ? 'replacement for '.$name
            : $reason;
    }
}
