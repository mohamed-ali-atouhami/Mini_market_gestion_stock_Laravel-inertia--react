<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleRequest;
use App\Models\Product;
use App\Models\Sale;
use App\Services\CashSessionService;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function __construct(
        private SaleService $sales,
        private CashSessionService $sessions,
    ) {
    }

    public function index(): Response|RedirectResponse
    {
        $this->authorize('create', Sale::class);

        $session = $this->sessions->currentOpen(request()->user());

        if ($session === null) {
            return redirect()
                ->route('caisse.index')
                ->with('status', 'Open the caisse before selling.');
        }

        return Inertia::render('Pos/Index', [
            'session' => [
                'id' => $session->id,
                'opened_at' => $session->opened_at?->format('Y-m-d H:i'),
                'opening_amount' => $session->opening_amount,
            ],
            'no_barcode_products' => $this->noBarcodeProducts(),
        ]);
    }

    public function lookupProduct(Request $request): JsonResponse
    {
        $this->authorize('create', Sale::class);

        $productId = $request->integer('product_id');
        $barcode = trim($request->string('barcode')->toString());

        $query = Product::query()->where('is_active', true);

        if ($productId > 0) {
            $product = $query->find($productId);
        } elseif ($barcode !== '') {
            $product = $query->where('barcode', $barcode)->first();
        } else {
            return response()->json(['product' => null], 404);
        }

        if ($product === null) {
            return response()->json(['product' => null], 404);
        }

        return response()->json([
            'product' => $this->productPayload($product),
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function noBarcodeProducts(): array
    {
        return Product::query()
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('barcode')->orWhere('barcode', '');
            })
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product) => $this->productPayload($product))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function productPayload(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'barcode' => $product->barcode,
            'sale_price' => $this->formatDecimal($product->sale_price, 2),
            'stock_quantity' => $this->formatDecimal($product->stock_quantity, 3),
            'unit' => $product->unit,
            'is_active' => $product->is_active,
            'image_url' => $product->imageUrl(),
        ];
    }

    public function store(StoreSaleRequest $request): RedirectResponse
    {
        $items = collect($request->validated('items'))
            ->map(fn (array $item) => [
                'product_id' => (int) $item['product_id'],
                'quantity' => $item['quantity'],
            ])
            ->all();

        $sale = $this->sales->checkout(
            $request->user(),
            $items,
            $request->validated('amount_paid'),
        );

        return redirect()
            ->route('sales.receipt', $sale)
            ->with('status', 'Sale recorded. Stock updated.');
    }

    private function formatDecimal(mixed $value, int $scale): string
    {
        $formatted = number_format((float) $value, $scale, '.', '');
        $formatted = rtrim(rtrim($formatted, '0'), '.');

        return $formatted === '' ? '0' : $formatted;
    }
}
