<?php

namespace App\Models;

use App\Support\Phone;
use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'phone_normalized',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<Sale, $this>
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public static function findOrCreateFromPos(string $name, string $phone): self
    {
        $normalized = Phone::normalize($phone);

        $customer = static::query()->where('phone_normalized', $normalized)->first();

        if ($customer === null) {
            return static::query()->create([
                'name' => $name,
                'phone' => $phone,
                'phone_normalized' => $normalized,
                'is_active' => true,
            ]);
        }

        $customer->update([
            'name' => $name,
            'phone' => $phone,
            'is_active' => true,
        ]);

        return $customer;
    }
}
