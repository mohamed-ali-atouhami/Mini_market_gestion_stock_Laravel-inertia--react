<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Models\StockMovement;
use App\Services\StockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    private const PER_PAGE = 10;

    public function __construct(private StockService $stock)
    {
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $search = $request->string('search')->toString();
        $category = $request->string('category')->toString();
        $status = $request->string('status')->toString();
        $stock = $request->string('stock')->toString();
        $sort = $request->string('sort')->toString();
        $order = $request->string('order')->toString() === 'desc' ? 'desc' : 'asc';

        $query = Product::query()->with('category');

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', '%'.$search.'%')
                    ->orWhere('barcode', 'like', '%'.$search.'%');
            });
        }

        if ($category !== '' && $category !== 'ALL') {
            $query->where('category_id', $category);
        }

        if ($status === 'ACTIVE') {
            $query->where('is_active', true);
        } elseif ($status === 'INACTIVE') {
            $query->where('is_active', false);
        }

        if ($stock === 'LOW') {
            $query->whereColumn('stock_quantity', '<=', 'min_stock');
        } elseif ($stock === 'OK') {
            $query->whereColumn('stock_quantity', '>', 'min_stock');
        }

        $sortColumn = in_array($sort, ['name', 'barcode', 'sale_price', 'stock_quantity'], true)
            ? $sort
            : 'name';

        $lowStockEnabled = Setting::current()->low_stock_enabled;

        $products = $query
            ->orderBy($sortColumn, $order)
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'barcode' => $product->barcode,
                'category' => $product->category?->name,
                'category_id' => $product->category_id,
                'cost_price' => $this->formatDecimal($product->cost_price, 2),
                'sale_price' => $this->formatDecimal($product->sale_price, 2),
                'stock_quantity' => $this->formatDecimal($product->stock_quantity, 3),
                'min_stock' => $this->formatDecimal($product->min_stock, 3),
                'unit' => $product->unit,
                'is_active' => $product->is_active,
                'is_low_stock' => $lowStockEnabled && $product->isLowStock(),
            ]);

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['is_active'] = $request->boolean('is_active', true);
        $openingStock = (float) ($data['stock_quantity'] ?? 0);
        $data['stock_quantity'] = 0;
        $data['unit'] = $data['unit'] ?? Product::UNIT_PIECE;

        if ($request->input('return_to') === 'purchases') {
            $openingStock = 0;
        }

        $product = Product::query()->create($data);

        if ($openingStock > 0) {
            $this->stock->adjust(
                $product,
                $openingStock,
                StockMovement::DIRECTION_IN,
                $request->user(),
                'Opening stock',
            );
        }

        $created = [
            'id' => $product->id,
            'name' => $product->name,
            'barcode' => $product->barcode,
            'cost_price' => $this->formatDecimal($product->cost_price, 2),
            'unit' => $product->unit,
            'is_active' => $product->is_active,
        ];

        if ($request->input('return_to') === 'purchases') {
            return back()
                ->with('status', 'Product created.')
                ->with('created_product', $created);
        }

        return redirect()
            ->route('products.index')
            ->with('status', 'Product created.');
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->safe()->except(['stock_quantity']);
        $data['is_active'] = $request->boolean('is_active');

        $product->update($data);

        return redirect()
            ->route('products.index')
            ->with('status', 'Product updated.');
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    private function categoryOptions(): array
    {
        return Category::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
            ])
            ->all();
    }

    private function formatDecimal(mixed $value, int $scale): string
    {
        $formatted = number_format((float) $value, $scale, '.', '');
        $formatted = rtrim(rtrim($formatted, '0'), '.');

        return $formatted === '' ? '0' : $formatted;
    }
}
