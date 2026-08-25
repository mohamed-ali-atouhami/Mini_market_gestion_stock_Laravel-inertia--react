<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseRequest;
use App\Http\Requests\UpdatePurchaseRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    private const PER_PAGE = 10;

    public function __construct(private PurchaseService $purchases)
    {
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Purchase::class);

        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $sort = $request->string('sort')->toString();
        $order = $request->string('order')->toString() === 'desc' ? 'desc' : 'asc';

        $query = Purchase::query()->with('supplier');

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('reference', 'like', '%'.$search.'%')
                    ->orWhere('invoice_number', 'like', '%'.$search.'%')
                    ->orWhereHas('supplier', fn ($supplier) => $supplier->where('name', 'like', '%'.$search.'%'));
            });
        }

        if ($status !== '' && $status !== 'ALL') {
            $query->where('status', $status);
        }

        $sortColumn = in_array($sort, ['reference', 'purchase_date', 'total'], true)
            ? $sort
            : 'purchase_date';

        $purchases = $query
            ->orderBy($sortColumn, $order)
            ->orderByDesc('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn (Purchase $purchase) => $this->listPayload($purchase));

        return Inertia::render('Purchases/Index', [
            'purchases' => $purchases,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Purchase::class);

        return Inertia::render('Purchases/Create', $this->formProps());
    }

    public function store(StorePurchaseRequest $request): RedirectResponse
    {
        $data = $this->payload($request->validated());
        $user = $request->user();

        $purchase = $request->boolean('receive')
            ? $this->purchases->saveAndReceive($data, $user)
            : $this->purchases->saveDraft($data, $user);

        $message = $request->boolean('receive')
            ? 'Delivery received. Stock updated.'
            : 'Draft delivery saved.';

        return redirect()
            ->route('purchases.index')
            ->with('status', $message);
    }

    public function show(Purchase $purchase): Response|RedirectResponse
    {
        $this->authorize('view', $purchase);

        if ($purchase->status === Purchase::STATUS_DRAFT) {
            return redirect()->route('purchases.edit', $purchase);
        }

        $purchase->load(['supplier', 'items.product', 'user']);

        return Inertia::render('Purchases/Show', [
            'purchase' => $this->detailPayload($purchase),
        ]);
    }

    public function edit(Purchase $purchase): Response|RedirectResponse
    {
        $this->authorize('view', $purchase);

        if ($purchase->status !== Purchase::STATUS_DRAFT) {
            return redirect()->route('purchases.show', $purchase);
        }

        $this->authorize('update', $purchase);

        $purchase->load(['items.product', 'supplier']);

        return Inertia::render('Purchases/Edit', [
            ...$this->formProps($purchase),
            'purchase' => $this->detailPayload($purchase),
        ]);
    }

    public function update(UpdatePurchaseRequest $request, Purchase $purchase): RedirectResponse
    {
        $data = $this->payload($request->validated());
        $user = $request->user();

        if ($request->boolean('receive')) {
            $this->authorize('receive', $purchase);
            $this->purchases->saveAndReceive($data, $user, $purchase);
            $message = 'Delivery received. Stock updated.';
        } else {
            $this->purchases->saveDraft($data, $user, $purchase);
            $message = 'Draft delivery saved.';
        }

        return redirect()
            ->route('purchases.index')
            ->with('status', $message);
    }

    public function receive(Purchase $purchase): RedirectResponse
    {
        $this->authorize('receive', $purchase);

        $this->purchases->receive($purchase, request()->user());

        return redirect()
            ->route('purchases.index')
            ->with('status', 'Delivery received. Stock updated.');
    }

    public function cancel(Purchase $purchase): RedirectResponse
    {
        $this->authorize('cancel', $purchase);

        $this->purchases->cancel($purchase);

        return redirect()
            ->route('purchases.index')
            ->with('status', 'Draft delivery cancelled.');
    }

    public function lookupProduct(Request $request): JsonResponse
    {
        $this->authorize('create', Purchase::class);

        $barcode = trim($request->string('barcode')->toString());

        if ($barcode === '') {
            return response()->json(['product' => null], 404);
        }

        $product = Product::query()
            ->where('is_active', true)
            ->where('barcode', $barcode)
            ->first();

        if ($product === null) {
            return response()->json(['product' => null], 404);
        }

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'barcode' => $product->barcode,
                'cost_price' => $this->formatDecimal($product->cost_price, 2),
                'unit' => $product->unit,
                'is_active' => $product->is_active,
                'image_url' => $product->imageUrl(),
            ],
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{
     *     supplier_id: int,
     *     purchase_date: string,
     *     invoice_number: string|null,
     *     notes: string|null,
     *     items: list<array{product_id: int, quantity: mixed, unit_cost: mixed}>
     * }
     */
    private function payload(array $validated): array
    {
        return [
            'supplier_id' => (int) $validated['supplier_id'],
            'purchase_date' => $validated['purchase_date'],
            'invoice_number' => $validated['invoice_number'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'items' => $validated['items'],
        ];
    }

    /**
     * @return array{suppliers: list<array{id: int, name: string}>, categories: list<array{id: int, name: string}>}
     */
    private function formProps(?Purchase $purchase = null): array
    {
        return [
            'suppliers' => Supplier::query()
                ->where(function ($query) use ($purchase) {
                    $query->where('is_active', true);

                    if ($purchase?->supplier_id) {
                        $query->orWhere('id', $purchase->supplier_id);
                    }
                })
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Supplier $supplier) => [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                ])
                ->all(),
            'categories' => Category::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Category $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                ])
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function listPayload(Purchase $purchase): array
    {
        return [
            'id' => $purchase->id,
            'reference' => $purchase->reference,
            'supplier' => $purchase->supplier?->name,
            'purchase_date' => $purchase->purchase_date?->toDateString(),
            'status' => $purchase->status,
            'total' => $purchase->total,
            'invoice_number' => $purchase->invoice_number,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function detailPayload(Purchase $purchase): array
    {
        return [
            'id' => $purchase->id,
            'reference' => $purchase->reference,
            'supplier_id' => $purchase->supplier_id,
            'supplier' => $purchase->supplier?->name,
            'purchase_date' => $purchase->purchase_date?->toDateString(),
            'invoice_number' => $purchase->invoice_number,
            'notes' => $purchase->notes,
            'status' => $purchase->status,
            'total' => $purchase->total,
            'items' => $purchase->items->map(fn ($item) => [
                'product_id' => $item->product_id,
                'name' => $item->product?->name ?? 'Product',
                'barcode' => $item->product?->barcode,
                'image_url' => $item->product?->imageUrl(),
                'quantity' => $this->formatDecimal($item->quantity, 3),
                'unit_cost' => $this->formatDecimal($item->unit_cost, 2),
            ])->all(),
        ];
    }

    /**
     * Strip trailing zeros so qty 6 is "6", not "6.000".
     * Number inputs treat "6.000" as 6000 in some locales.
     */
    private function formatDecimal(mixed $value, int $scale): string
    {
        $formatted = number_format((float) $value, $scale, '.', '');
        $formatted = rtrim(rtrim($formatted, '0'), '.');

        return $formatted === '' ? '0' : $formatted;
    }
}
