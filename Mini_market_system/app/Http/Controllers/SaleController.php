<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    private const PER_PAGE = 10;

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Sale::class);

        $search = $request->string('search')->toString();
        $sort = $request->string('sort')->toString();
        $order = $request->string('order')->toString() === 'desc' ? 'desc' : 'asc';

        $query = Sale::query()->with('user');

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('reference', 'like', '%'.$search.'%')
                    ->orWhereHas('user', fn ($user) => $user->where('name', 'like', '%'.$search.'%'));
            });
        }

        $sortColumn = in_array($sort, ['reference', 'total', 'created_at'], true)
            ? $sort
            : 'created_at';

        $sales = $query
            ->orderBy($sortColumn, $order)
            ->orderByDesc('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn (Sale $sale) => [
                'id' => $sale->id,
                'reference' => $sale->reference,
                'cashier' => $sale->user?->name,
                'status' => $sale->status,
                'total' => $sale->total,
                'amount_paid' => $sale->amount_paid,
                'change_amount' => $sale->change_amount,
                'sold_at' => $sale->created_at?->format('Y-m-d H:i'),
            ]);

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
        ]);
    }

    public function show(Sale $sale): Response
    {
        $this->authorize('view', $sale);

        $sale->load(['items.product', 'user']);

        return Inertia::render('Sales/Show', [
            'sale' => $this->detailPayload($sale),
        ]);
    }

    public function receipt(Sale $sale): Response
    {
        $this->authorize('view', $sale);

        $sale->load(['items.product', 'user']);
        $shop = Setting::query()->first();

        return Inertia::render('Sales/Receipt', [
            'sale' => $this->detailPayload($sale),
            'shop' => [
                'name' => $shop?->shop_name ?? 'Mini market',
                'phone' => $shop?->shop_phone,
                'address' => $shop?->shop_address,
                'footer' => $shop?->ticket_footer,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function detailPayload(Sale $sale): array
    {
        return [
            'id' => $sale->id,
            'reference' => $sale->reference,
            'cashier' => $sale->user?->name,
            'status' => $sale->status,
            'total' => $sale->total,
            'amount_paid' => $sale->amount_paid,
            'change_amount' => $sale->change_amount,
            'sold_at' => $sale->created_at?->format('Y-m-d H:i'),
            'items' => $sale->items->map(fn ($item) => [
                'product_id' => $item->product_id,
                'name' => $item->product?->name,
                'barcode' => $item->product?->barcode,
                'quantity' => $this->formatDecimal($item->quantity, 3),
                'unit_price' => $this->formatDecimal($item->unit_price, 2),
            ])->all(),
        ];
    }

    private function formatDecimal(mixed $value, int $scale): string
    {
        $formatted = number_format((float) $value, $scale, '.', '');
        $formatted = rtrim(rtrim($formatted, '0'), '.');

        return $formatted === '' ? '0' : $formatted;
    }
}
