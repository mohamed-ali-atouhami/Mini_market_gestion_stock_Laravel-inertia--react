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
        ]);
    }

    public function lookupProduct(Request $request): JsonResponse
    {
        $this->authorize('create', Sale::class);

        $barcode = trim($request->string('barcode')->toString());

        if ($barcode === '') {
            return response()->json(['product' => null], 404);
        }

        $product = Product::query()
            ->where('barcode', $barcode)
            ->where('is_active', true)
            ->first();

        if ($product === null) {
            return response()->json(['product' => null], 404);
        }

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'barcode' => $product->barcode,
                'sale_price' => $this->formatDecimal($product->sale_price, 2),
                'stock_quantity' => $this->formatDecimal($product->stock_quantity, 3),
                'unit' => $product->unit,
                'is_active' => $product->is_active,
            ],
        ]);
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
