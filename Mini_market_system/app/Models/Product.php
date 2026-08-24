<?php

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    public const UNIT_PIECE = 'piece';

    public const UNIT_KG = 'kg';

    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'barcode',
        'image_path',
        'cost_price',
        'sale_price',
        'stock_quantity',
        'min_stock',
        'unit',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'stock_quantity' => 'decimal:3',
            'min_stock' => 'decimal:3',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return HasMany<PurchaseItem, $this>
     */
    public function purchaseItems(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    /**
     * @return HasMany<SaleItem, $this>
     */
    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * @return HasMany<StockMovement, $this>
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function isLowStock(): bool
    {
        return (float) $this->stock_quantity <= (float) $this->min_stock;
    }

    public function imageUrl(): ?string
    {
        return self::storedImageUrl($this->image_path);
    }

    public static function storedImageUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        return '/storage/'.ltrim($path, '/');
    }

    public function syncImage(?UploadedFile $file, bool $remove = false): void
    {
        if ($file instanceof UploadedFile) {
            $this->clearStoredImage();
            $this->update([
                'image_path' => $file->store('products', 'public'),
            ]);

            return;
        }

        if ($remove) {
            $this->clearStoredImage();
            $this->update(['image_path' => null]);
        }
    }

    private function clearStoredImage(): void
    {
        if ($this->image_path !== null) {
            Storage::disk('public')->delete($this->image_path);
        }
    }
}
