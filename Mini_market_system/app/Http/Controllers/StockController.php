<?php

namespace App\Http\Controllers;

use App\Exceptions\InsufficientStockException;
use App\Http\Requests\AdjustStockRequest;
use App\Models\Product;
use App\Models\Setting;
use App\Models\StockMovement;
use App\Services\StockService;
use App\Support\Formats;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    private const PER_PAGE = 10;

    public function __construct(private StockService $stock)
    {
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $search = $request->string('search')->toString();
        $stock = $request->string('stock')->toString();
        $sort = $request->string('sort')->toString();
        $order = $request->string('order')->toString() === 'desc' ? 'desc' : 'asc';
        $lowStockEnabled = Setting::current()->low_stock_enabled;

        $query = Product::query();

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', '%'.$search.'%')
                    ->orWhere('barcode', 'like', '%'.$search.'%');
            });
        }

        if ($stock === 'LOW') {
            $query->whereColumn('stock_quantity', '<=', 'min_stock');
        } elseif ($stock === 'OK') {
            $query->whereColumn('stock_quantity', '>', 'min_stock');
        }

        $sortColumn = in_array($sort, ['name', 'barcode', 'stock_quantity', 'min_stock'], true)
            ? $sort
            : 'name';

        $products = $query
            ->orderBy($sortColumn, $order)
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'barcode' => $product->barcode,
                'stock_quantity' => Formats::decimal($product->stock_quantity, 3),
                'min_stock' => Formats::decimal($product->min_stock, 3),
                'is_low_stock' => $lowStockEnabled && $product->isLowStock(),
                'image_url' => $product->imageUrl(),
            ]);

        return Inertia::render('Stock/Index', [
            'products' => $products,
        ]);
    }

    public function show(Product $product): Response
    {
        $this->authorize('viewAny', Product::class);

        $movements = $product->stockMovements()
            ->with(['user', 'reference'])
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(fn (StockMovement $movement) => $this->movementPayload($movement));

        return Inertia::render('Stock/Show', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'barcode' => $product->barcode,
                'stock_quantity' => Formats::decimal($product->stock_quantity, 3),
                'min_stock' => Formats::decimal($product->min_stock, 3),
                'is_low_stock' => Setting::current()->low_stock_enabled && $product->isLowStock(),
                'image_url' => $product->imageUrl(),
            ],
            'movements' => $movements,
        ]);
    }

    public function adjust(AdjustStockRequest $request, Product $product): RedirectResponse
    {
        try {
            $this->stock->adjust(
                $product,
                $request->validated('quantity'),
                $request->validated('direction'),
                $request->user(),
                trim($request->validated('reason')),
            );
        } catch (InsufficientStockException $exception) {
            throw ValidationException::withMessages([
                'quantity' => $exception->getMessage(),
            ]);
        }

        return redirect()
            ->route('stock.show', $product)
            ->with('status', 'Stock updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function movementPayload(StockMovement $movement): array
    {
        return [
            'id' => $movement->id,
            'type' => $movement->typeLabel(),
            'direction' => $movement->direction,
            'quantity' => Formats::decimal($movement->quantity, 3),
            'quantity_before' => Formats::decimal($movement->quantity_before, 3),
            'quantity_after' => Formats::decimal($movement->quantity_after, 3),
            'reason' => $movement->reason,
            'user' => $movement->user?->name,
            'created_at' => $movement->created_at?->format('Y-m-d H:i'),
        ];
    }
}
