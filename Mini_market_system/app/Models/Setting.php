<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    public const CREATED_AT = null;

    protected $fillable = [
        'shop_name',
        'shop_phone',
        'shop_address',
        'currency',
        'ticket_footer',
        'low_stock_enabled',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'low_stock_enabled' => 'boolean',
            'updated_at' => 'datetime',
        ];
    }

    public static function current(): self
    {
        return static::query()->firstOrCreate(
            ['id' => 1],
            [
                'shop_name' => 'Mini market',
                'currency' => 'MAD',
                'low_stock_enabled' => true,
            ],
        );
    }
}
