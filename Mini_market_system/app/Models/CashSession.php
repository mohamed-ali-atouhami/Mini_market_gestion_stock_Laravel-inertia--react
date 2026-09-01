<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashSession extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_CLOSED = 'closed';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'opened_at',
        'closed_at',
        'opening_amount',
        'closing_amount',
        'expected_amount',
        'difference',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'opening_amount' => 'decimal:2',
            'closing_amount' => 'decimal:2',
            'expected_amount' => 'decimal:2',
            'difference' => 'decimal:2',
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
     * @return HasMany<Sale, $this>
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    /**
     * @return HasMany<CreditPayment, $this>
     */
    public function creditPayments(): HasMany
    {
        return $this->hasMany(CreditPayment::class);
    }

    /**
     * @return HasMany<CustomerReturn, $this>
     */
    public function customerReturns(): HasMany
    {
        return $this->hasMany(CustomerReturn::class);
    }

    public function cashInDrawer(): float
    {
        $fromSales = $this->sales()
            ->where('status', Sale::STATUS_COMPLETED)
            ->get()
            ->sum(fn (Sale $sale) => $sale->drawerAmount());

        $fromCredit = (float) $this->creditPayments()->sum('amount');
        $fromReturns = (float) $this->customerReturns()->sum('cash_delta');

        return round((float) $fromSales + $fromCredit + $fromReturns, 2);
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }
}
