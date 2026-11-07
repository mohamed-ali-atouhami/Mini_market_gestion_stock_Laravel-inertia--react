<?php

namespace App\Http\Controllers;

use App\Exceptions\InsufficientStockException;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Models\StockMovement;
use App\Services\StockService;
use App\Support\SimpleXlsx;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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

        $lowStockEnabled = Setting::current()->low_stock_enabled;

        $products = $this->filteredProducts($request)
            ->with('category')
            ->orderBy($this->sortColumn($request), $this->sortOrder($request))
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
                'first_on_till' => $product->first_on_till,
                'is_low_stock' => $lowStockEnabled && $product->isLowStock(),
                'image_url' => $product->imageUrl(),
            ]);

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function export(Request $request): HttpResponse
    {
        $this->authorize('viewAny', Product::class);

        $products = $this->filteredProducts($request)
            ->with('category')
            ->orderBy($this->sortColumn($request), $this->sortOrder($request))
            ->get();

        $rows = $products->map(fn (Product $product) => [
            $product->name,
            $product->category?->name,
            $product->barcode,
            $this->formatDecimal($product->cost_price, 2),
            $this->formatDecimal($product->sale_price, 2),
            $this->formatDecimal($product->stock_quantity, 3),
            $this->formatDecimal($product->min_stock, 3),
            $product->unit,
            $product->image_path,
        ])->all();

        $file = SimpleXlsx::make(
            ['Name', 'Category', 'Barcode', 'Cost price', 'Sale price', 'Stock', 'Min stock', 'Unit', 'image_path'],
            $rows,
        );

        return response($file, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="products.xlsx"',
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $data = $request->safe()->except(['image', 'remove_image']);
        $data['is_active'] = $request->boolean('is_active', true);
        $data['first_on_till'] = $request->boolean('first_on_till');
        $openingStock = (float) ($data['stock_quantity'] ?? 0);
        $data['stock_quantity'] = 0;
        $data['unit'] = $data['unit'] ?? Product::UNIT_PIECE;

        if ($request->input('return_to') === 'purchases') {
            $openingStock = 0;
        }

        $product = DB::transaction(function () use ($request, $data, $openingStock) {
            $created = Product::query()->create($data);
            $created->syncImage($request->file('image'));

            if ($openingStock > 0) {
                try {
                    $this->stock->adjust(
                        $created,
                        $openingStock,
                        StockMovement::DIRECTION_IN,
                        $request->user(),
                        'Opening stock',
                    );
                } catch (InsufficientStockException $exception) {
                    throw ValidationException::withMessages([
                        'stock_quantity' => $exception->getMessage(),
                    ]);
                }
            }

            return $created->refresh();
        });

        $created = [
            'id' => $product->id,
            'name' => $product->name,
            'barcode' => $product->barcode,
            'cost_price' => $this->formatDecimal($product->cost_price, 2),
            'unit' => $product->unit,
            'is_active' => $product->is_active,
            'image_url' => $product->imageUrl(),
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
        $data = $request->safe()->except(['stock_quantity', 'image', 'remove_image']);
        $data['is_active'] = $request->boolean('is_active');

        if ($request->exists('first_on_till')) {
            $data['first_on_till'] = $request->boolean('first_on_till');
        }

        $product->update($data);
        $product->syncImage($request->file('image'), $request->boolean('remove_image'));

        return redirect()
            ->route('products.index')
            ->with('status', 'Product updated.');
    }

    /**
     * @return Builder<Product>
     */
    private function filteredProducts(Request $request): Builder
    {
        $search = $request->string('search')->toString();
        $category = $request->string('category')->toString();
        $status = $request->string('status')->toString();
        $stock = $request->string('stock')->toString();

        $query = Product::query();

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

        return $query;
    }

    private function sortColumn(Request $request): string
    {
        $sort = $request->string('sort')->toString();

        return in_array($sort, ['name', 'barcode', 'sale_price', 'stock_quantity'], true)
            ? $sort
            : 'name';
    }

    private function sortOrder(Request $request): string
    {
        return $request->string('order')->toString() === 'desc' ? 'desc' : 'asc';
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
