<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerReturn extends Model
{
    public const ACTION_REFUND = 'refund';

    public const ACTION_REPLACE = 'replace';

    public const CONDITION_SELLABLE = 'sellable';

    public const CONDITION_DEFECTIVE = 'defective';

    public const SUPPLIER_NONE = 'none';

    public const SUPPLIER_WAITING = 'waiting';

    public const SUPPLIER_GIVEN = 'given';

    public static function nextReference(): string
    {
        $year = now()->year;
        $prefix = 'RET-'.$year.'-';
        $last = static::query()
            ->where('reference', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->lockForUpdate()
            ->value('reference');

        $next = 1;
        if (is_string($last) && preg_match('/(\d+)$/', $last, $matches) === 1) {
            $next = (int) $matches[1] + 1;
        }

        return sprintf('RET-%d-%04d', $year, $next);
    }

    protected $fillable = [
        'reference',
        'user_id',
        'cash_session_id',
        'cash_delta',
        'amount_paid',
        'change_amount',
        'reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'cash_delta' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'change_amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<CashSession, $this>
     */
    public function cashSession(): BelongsTo
    {
        return $this->belongsTo(CashSession::class);
    }

    /**
     * @return HasMany<CustomerReturnItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(CustomerReturnItem::class);
    }
}
