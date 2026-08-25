<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const PAYMENT_CASH = 'cash';

    public const PAYMENT_CREDIT = 'credit';

    public static function nextReference(): string
    {
        $year = now()->year;
        $prefix = 'SAL-'.$year.'-';
        $last = static::query()
            ->where('reference', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->lockForUpdate()
            ->value('reference');

        $next = 1;
        if (is_string($last) && preg_match('/(\d+)$/', $last, $matches) === 1) {
            $next = (int) $matches[1] + 1;
        }

        return sprintf('SAL-%d-%04d', $year, $next);
    }

    protected $fillable = [
        'reference',
        'user_id',
        'cash_session_id',
        'status',
        'payment_method',
        'customer_id',
        'due_date',
        'total',
        'amount_paid',
        'change_amount',
        'remaining_amount',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'total' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'change_amount' => 'decimal:2',
            'remaining_amount' => 'decimal:2',
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
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return HasMany<SaleItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * @return HasMany<CreditPayment, $this>
     */
    public function creditPayments(): HasMany
    {
        return $this->hasMany(CreditPayment::class);
    }

    public function isCredit(): bool
    {
        return $this->payment_method === self::PAYMENT_CREDIT;
    }

    public function paidSoFar(): float
    {
        if ($this->isCredit()) {
            return round((float) $this->total - (float) $this->remaining_amount, 2);
        }

        return round((float) $this->amount_paid, 2);
    }

    public function drawerAmount(): float
    {
        if ($this->isCredit()) {
            return round((float) $this->amount_paid, 2);
        }

        return round((float) $this->total, 2);
    }
}
