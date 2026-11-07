<?php

namespace App\Models;

use Database\Factories\CategoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    public const TILL_LIMIT = 12;

    /** @use HasFactory<CategoryFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'is_active',
        'show_on_till',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'show_on_till' => 'boolean',
        ];
    }

    public static function tillIsFull(?int $exceptId = null): bool
    {
        $query = static::query()->where('show_on_till', true);

        if ($exceptId !== null) {
            $query->whereKeyNot($exceptId);
        }

        return $query->count() >= self::TILL_LIMIT;
    }

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
