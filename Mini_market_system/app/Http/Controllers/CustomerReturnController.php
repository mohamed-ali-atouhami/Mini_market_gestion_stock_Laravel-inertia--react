<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerReturnRequest;
use App\Models\Category;
use App\Models\CustomerReturn;
use App\Models\CustomerReturnItem;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Setting;
use App\Models\Supplier;
use App\Services\CashSessionService;
use App\Services\ReturnService;
use App\Support\Formats;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CustomerReturnController extends Controller
{
    public function __construct(
        private ReturnService $returns,
        private CashSessionService $sessions,
    ) {
    }

    public function index(): Response|RedirectResponse
    {
        $this->authorize('viewAny', CustomerReturn::class);

        $session = $this->sessions->currentOpen(request()->user());

        if ($session === null) {
            return redirect()
                ->route('caisse.index')
                ->with('status', 'Open the caisse before returns.');
        }

        return Inertia::render('Returns/Index', [
            'session' => [
                'id' => $session->id,
                'opened_at' => $session->opened_at?->format('Y-m-d H:i'),
                'opening_amount' => $session->opening_amount,
            ],
            'products' => $products = $this->products(),
            'categories' => $this->categories(),
            'suppliers' => $this->suppliers(
                collect($products)->pluck('last_supplier_id')->filter()->all(),
            ),
            'waiting' => $this->waiting(),
        ]);
    }

    public function store(StoreCustomerReturnRequest $request): RedirectResponse
    {
        $this->returns->record($request->user(), $request->validated());

        return redirect()
            ->route('returns.index')
            ->with('status', 'Return recorded.');
    }

    public function give(CustomerReturnItem $customerReturnItem): RedirectResponse
    {
        $this->authorize('giveToSupplier', $customerReturnItem->customerReturn);

        $this->returns->giveToSupplier(request()->user(), $customerReturnItem);

        return redirect()
            ->route('returns.index')
            ->with('status', 'Given to the supplier.');
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function products(): array
    {
        $lowStockEnabled = Setting::current()->low_stock_enabled;
        $products = Product::query()
            ->with('category')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $lastSuppliers = $this->lastSupplierIds($products->pluck('id')->all());

        return $products
            ->sortBy(fn (Product $product) => ((float) $product->stock_quantity > 0 ? '0' : '1')
                .'-'.mb_strtolower($product->name))
            ->values()
            ->map(fn (Product $product) => [
                ...$this->productPayload($product, $lowStockEnabled),
                'last_supplier_id' => $lastSuppliers[$product->id] ?? null,
            ])
            ->all();
    }

    /**
     * @param  list<int>  $productIds
     * @return array<int, int>
     */
    private function lastSupplierIds(array $productIds): array
    {
        if ($productIds === []) {
            return [];
        }

        $rows = PurchaseItem::query()
            ->select('purchase_items.product_id', 'purchases.supplier_id')
            ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
            ->where('purchases.status', Purchase::STATUS_RECEIVED)
            ->whereIn('purchase_items.product_id', $productIds)
            ->orderByDesc('purchase_items.id')
            ->get();

        $map = [];

        foreach ($rows as $row) {
            $productId = (int) $row->product_id;

            if (! isset($map[$productId])) {
                $map[$productId] = (int) $row->supplier_id;
            }
        }

        return $map;
    }

    /**
     * @return array<string, mixed>
     */
    private function productPayload(Product $product, bool $lowStockEnabled): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'barcode' => $product->barcode,
            'category_id' => $product->category_id,
            'sale_price' => Formats::decimal($product->sale_price, 2),
            'stock_quantity' => Formats::decimal($product->stock_quantity, 3),
            'min_stock' => Formats::decimal($product->min_stock, 3),
            'unit' => $product->unit,
            'is_active' => $product->is_active,
            'is_low_stock' => $lowStockEnabled && $product->isLowStock(),
            'image_url' => $product->imageUrl(),
        ];
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    private function categories(): array
    {
        return Category::query()
            ->where('is_active', true)
            ->whereHas('products', function ($query) {
                $query->where('is_active', true);
            })
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
            ])
            ->all();
    }

    /**
     * @param  list<int|string>  $extraIds
     * @return list<array{id: int, name: string}>
     */
    private function suppliers(array $extraIds = []): array
    {
        $extraIds = array_values(array_unique(array_map('intval', $extraIds)));

        return Supplier::query()
            ->where(function ($query) use ($extraIds) {
                $query->where('is_active', true);

                if ($extraIds !== []) {
                    $query->orWhereIn('id', $extraIds);
                }
            })
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Supplier $supplier) => [
                'id' => $supplier->id,
                'name' => $supplier->name,
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function waiting(): array
    {
        return CustomerReturnItem::query()
            ->with(['returnedProduct', 'supplier', 'customerReturn.user'])
            ->where('supplier_status', CustomerReturn::SUPPLIER_WAITING)
            ->orderByDesc('id')
            ->get()
            ->map(fn (CustomerReturnItem $row) => [
                'id' => $row->id,
                'reference' => $row->customerReturn?->reference,
                'returned_product' => $row->returnedProduct?->name,
                'returned_quantity' => Formats::decimal($row->returned_quantity, 3),
                'supplier' => $row->supplier?->name,
                'cashier' => $row->customerReturn?->user?->name,
                'created_at' => $row->created_at?->format('Y-m-d H:i'),
            ])
            ->all();
    }
}
