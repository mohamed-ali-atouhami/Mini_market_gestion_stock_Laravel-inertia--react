<?php

namespace App\Http\Controllers;

use App\Models\CashSession;
use App\Models\CustomerReturn;
use App\Models\CustomerReturnItem;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Setting;
use App\Models\StockMovement;
use App\Support\Formats;
use App\Support\SimplePdf;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * @var array<int, string>
     */
    private const WEEKDAYS = [
        1 => 'Mon',
        2 => 'Tue',
        3 => 'Wed',
        4 => 'Thu',
        5 => 'Fri',
        6 => 'Sat',
        7 => 'Sun',
    ];

    public function index(Request $request): Response
    {
        [$from, $to] = $this->range($request);
        $summary = $this->summary($from, $to);

        return Inertia::render('Reports/Index', [
            'filters' => [
                'from' => $from,
                'to' => $to,
            ],
            'summary' => [
                'sales_total' => Formats::money($summary['sales_total']),
                'ticket_count' => $summary['ticket_count'],
                'profit' => Formats::money($summary['profit']),
                'purchases_total' => Formats::money($summary['purchases_total']),
            ],
            'sales_by_day' => $this->salesByDay($from, $to),
            'top_products' => $this->topProducts($from, $to, 10),
            'purchases_by_supplier' => $this->purchasesBySupplier($from, $to),
            'caisse_today' => $this->caisseToday(),
            'sessions' => $this->sessions($from, $to),
            'movements' => $this->movements($from, $to),
        ]);
    }

    public function pdf(Request $request): HttpResponse
    {
        [$from, $to] = $this->range($request);
        $summary = $this->summary($from, $to);
        $shop = Setting::current();
        $shopName = trim((string) $shop->shop_name) !== '' ? $shop->shop_name : 'Mini market';
        $currency = trim((string) $shop->currency) !== '' ? $shop->currency : 'MAD';
        $days = $this->salesByDay($from, $to);
        $soldDays = array_values(array_filter(
            $days,
            fn (array $day): bool => $day['tickets'] > 0,
        ));

        $pdf = new SimplePdf($shopName);
        $pdf->title($shopName);
        $pdf->subtitle('Report');
        $pdf->subtitle($this->periodLabel($from, $to));
        $pdf->metrics([
            ['label' => 'Sales', 'value' => $this->pdfMoney($summary['sales_total'], $currency)],
            ['label' => 'Tickets', 'value' => (string) $summary['ticket_count']],
            [
                'label' => 'Profit',
                'value' => $this->pdfMoney($summary['profit'], $currency),
                'color' => $summary['profit'] < 0 ? '0.75 0.15 0.15' : '0.09 0.45 0.20',
            ],
            ['label' => 'Purchases', 'value' => $this->pdfMoney($summary['purchases_total'], $currency)],
        ]);

        $pdf->heading('Sales by day');

        if ($soldDays === []) {
            $pdf->paragraph('No sales in this period.');
        } else {
            if (count($days) <= 16) {
                $pdf->bars(array_map(fn (array $day): array => [
                    'label' => count($days) <= 7 ? $day['weekday'] : $day['date_label'],
                    'value' => $day['total'],
                ], $days));
            }

            $pdf->table(
                ['Date', 'Tickets', 'Sales'],
                array_map(fn (array $day): array => [
                    $day['day'],
                    (string) $day['tickets'],
                    $this->pdfMoney($day['total'], $currency),
                ], $soldDays),
                [0.4, 0.2, 0.4],
            );
        }

        $pdf->heading('Top products');
        $products = $this->topProducts($from, $to, 10);

        if ($products === []) {
            $pdf->paragraph('No products sold in this period.');
        } else {
            $pdf->table(
                ['Product', 'Qty', 'Sales'],
                array_map(fn (array $product): array => [
                    $product['name'],
                    $product['quantity'],
                    $product['total'].' '.$currency,
                ], $products),
                [0.56, 0.14, 0.3],
            );
        }

        $pdf->heading('Purchases');
        $suppliers = $this->purchasesBySupplier($from, $to);

        if ($suppliers === []) {
            $pdf->paragraph('No purchases in this period.');
        } else {
            $pdf->table(
                ['Supplier', 'Deliveries', 'Total'],
                array_map(fn (array $supplier): array => [
                    $supplier['name'],
                    (string) $supplier['deliveries'],
                    $supplier['total'].' '.$currency,
                ], $suppliers),
                [0.5, 0.2, 0.3],
            );
        }

        $pdf->heading('Caisse');
        $sessions = $this->sessions($from, $to);

        if ($sessions === []) {
            $pdf->paragraph('No caisse sessions in this period.');
        } else {
            $pdf->table(
                ['Cashier', 'Opened', 'Status', 'Difference'],
                array_map(fn (array $session): array => [
                    (string) ($session['cashier'] ?? ''),
                    (string) ($session['opened_at'] ?? ''),
                    (string) $session['status'],
                    $session['difference'] ?? '-',
                ], $sessions),
                [0.28, 0.34, 0.16, 0.22],
            );

            if (count($sessions) === 50) {
                $pdf->paragraph('Latest 50 caisse sessions in this period.');
            }
        }

        $name = $from === $to
            ? 'report-'.$from.'.pdf'
            : 'report-'.$from.'-to-'.$to.'.pdf';

        return response($pdf->render(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$name.'"',
        ]);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function range(Request $request): array
    {
        $from = $request->date('from')?->toDateString() ?? now()->startOfMonth()->toDateString();
        $to = $request->date('to')?->toDateString() ?? now()->toDateString();

        if ($from > $to) {
            [$from, $to] = [$to, $from];
        }

        return [$from, $to];
    }

    /**
     * @return array{sales_total: float, ticket_count: int, profit: float, purchases_total: float}
     */
    private function summary(string $from, string $to): array
    {
        $salesQuery = Sale::query()
            ->where('status', Sale::STATUS_COMPLETED)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to);

        return [
            'sales_total' => (float) (clone $salesQuery)->sum('total'),
            'ticket_count' => (clone $salesQuery)->count(),
            'profit' => $this->profitForPeriod($from, $to),
            'purchases_total' => (float) Purchase::query()
                ->where('status', Purchase::STATUS_RECEIVED)
                ->whereDate('purchase_date', '>=', $from)
                ->whereDate('purchase_date', '<=', $to)
                ->sum('total'),
        ];
    }

    private function periodLabel(string $from, string $to): string
    {
        $start = Carbon::parse($from)->format('j M Y');
        $end = Carbon::parse($to)->format('j M Y');

        return $from === $to ? $start : $start.' - '.$end;
    }

    private function pdfMoney(float $amount, string $currency): string
    {
        return number_format($amount, 2, '.', ',').' '.$currency;
    }

    private function profitForPeriod(string $from, string $to): float
    {
        $salesProfit = (float) SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.status', Sale::STATUS_COMPLETED)
            ->whereDate('sales.created_at', '>=', $from)
            ->whereDate('sales.created_at', '<=', $to)
            ->selectRaw('COALESCE(SUM((sale_items.unit_price - sale_items.unit_cost) * sale_items.quantity), 0) as profit')
            ->value('profit');

        $returnItems = CustomerReturnItem::query()
            ->join('customer_returns', 'customer_returns.id', '=', 'customer_return_items.customer_return_id')
            ->whereDate('customer_returns.created_at', '>=', $from)
            ->whereDate('customer_returns.created_at', '<=', $to)
            ->get([
                'customer_return_items.action',
                'customer_return_items.condition',
                'customer_return_items.returned_quantity',
                'customer_return_items.returned_unit_cost',
                'customer_return_items.returned_value',
                'customer_return_items.replacement_quantity',
                'customer_return_items.replacement_unit_cost',
                'customer_return_items.replacement_value',
            ]);

        $adjustment = 0.0;

        foreach ($returnItems as $item) {
            $returnedValue = (float) $item->returned_value;
            $returnedCost = round((float) $item->returned_unit_cost * (float) $item->returned_quantity, 2);

            $adjustment -= $returnedValue;

            if ($item->condition === CustomerReturn::CONDITION_SELLABLE) {
                $adjustment += $returnedCost;
            }

            if ($item->action === CustomerReturn::ACTION_REPLACE) {
                $replacementValue = (float) ($item->replacement_value ?? 0);
                $replacementCost = round(
                    (float) ($item->replacement_unit_cost ?? 0) * (float) ($item->replacement_quantity ?? 0),
                    2,
                );
                $adjustment += $replacementValue - $replacementCost;
            }
        }

        return round($salesProfit + $adjustment, 2);
    }

    /**
     * @return list<array{day: string, weekday: string, date_label: string, tickets: int, total: float}>
     */
    private function salesByDay(string $from, string $to): array
    {
        $sales = Sale::query()
            ->selectRaw('DATE(created_at) as day, COUNT(*) as tickets, SUM(total) as total')
            ->where('status', Sale::STATUS_COMPLETED)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        $rows = [];

        foreach (CarbonPeriod::create($from, $to) as $date) {
            $day = $date->toDateString();
            $row = $sales->get($day);

            $rows[] = [
                'day' => $day,
                'weekday' => self::WEEKDAYS[$date->isoWeekday()],
                'date_label' => $date->format('d/m'),
                'tickets' => (int) ($row->tickets ?? 0),
                'total' => (float) ($row->total ?? 0),
            ];
        }

        return $rows;
    }

    /**
     * @return list<array{id: int, name: string, quantity: string, total: string, image_url: string|null}>
     */
    private function topProducts(string $from, string $to, int $limit): array
    {
        return SaleItem::query()
            ->select([
                'sale_items.product_id',
                'products.name',
                'products.image_path',
                DB::raw('SUM(sale_items.quantity) as quantity'),
                DB::raw('SUM(sale_items.quantity * sale_items.unit_price) as total'),
            ])
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.status', Sale::STATUS_COMPLETED)
            ->whereDate('sales.created_at', '>=', $from)
            ->whereDate('sales.created_at', '<=', $to)
            ->groupBy('sale_items.product_id', 'products.name', 'products.image_path')
            ->orderByDesc('quantity')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->product_id,
                'name' => $row->name,
                'quantity' => Formats::decimal($row->quantity, 3),
                'total' => Formats::money($row->total),
                'image_url' => Product::storedImageUrl($row->image_path),
            ])
            ->all();
    }

    /**
     * @return list<array{name: string, deliveries: int, total: string}>
     */
    private function purchasesBySupplier(string $from, string $to): array
    {
        return Purchase::query()
            ->select([
                'suppliers.name',
                DB::raw('COUNT(purchases.id) as deliveries'),
                DB::raw('SUM(purchases.total) as total'),
            ])
            ->join('suppliers', 'suppliers.id', '=', 'purchases.supplier_id')
            ->where('purchases.status', Purchase::STATUS_RECEIVED)
            ->whereDate('purchases.purchase_date', '>=', $from)
            ->whereDate('purchases.purchase_date', '<=', $to)
            ->groupBy('purchases.supplier_id', 'suppliers.name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'deliveries' => (int) $row->deliveries,
                'total' => Formats::money($row->total),
            ])
            ->all();
    }

    /**
     * @return array{
     *     cashier: string|null,
     *     status: string,
     *     opening: string,
     *     cash_sales: string,
     *     expected: string,
     *     counted: string|null,
     *     difference: string|null
     * }|null
     */
    private function caisseToday(): ?array
    {
        $session = CashSession::query()
            ->with('user')
            ->whereDate('opened_at', now()->toDateString())
            ->orderByDesc('opened_at')
            ->orderByDesc('id')
            ->first();

        if ($session === null) {
            return null;
        }

        $opening = (float) $session->opening_amount;
        $cashIn = $session->isOpen()
            ? $session->cashInDrawer()
            : round((float) $session->expected_amount - $opening, 2);
        $expected = $session->isOpen()
            ? round($opening + $cashIn, 2)
            : (float) $session->expected_amount;

        return [
            'cashier' => $session->user?->name,
            'status' => $session->status,
            'opening' => Formats::money($opening),
            'cash_sales' => Formats::money($cashIn),
            'expected' => Formats::money($expected),
            'counted' => $session->closing_amount === null
                ? null
                : Formats::money($session->closing_amount),
            'difference' => $session->difference === null
                ? null
                : Formats::money($session->difference),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function sessions(string $from, string $to): array
    {
        return CashSession::query()
            ->with('user')
            ->whereDate('opened_at', '>=', $from)
            ->whereDate('opened_at', '<=', $to)
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(fn (CashSession $session) => [
                'id' => $session->id,
                'cashier' => $session->user?->name,
                'status' => $session->status,
                'opened_at' => $session->opened_at?->format('Y-m-d H:i'),
                'opening_amount' => Formats::money($session->opening_amount),
                'expected_amount' => $session->expected_amount === null
                    ? null
                    : Formats::money($session->expected_amount),
                'closing_amount' => $session->closing_amount === null
                    ? null
                    : Formats::money($session->closing_amount),
                'difference' => $session->difference === null
                    ? null
                    : Formats::money($session->difference),
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function movements(string $from, string $to): array
    {
        return StockMovement::query()
            ->with(['product', 'user', 'reference'])
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(fn (StockMovement $movement) => [
                'id' => $movement->id,
                'product' => $movement->product?->name,
                'image_url' => $movement->product?->imageUrl(),
                'type' => $movement->typeLabel(),
                'direction' => $movement->direction,
                'quantity' => Formats::decimal($movement->quantity, 3),
                'reason' => $movement->reasonLabel(),
                'user' => $movement->user?->name,
                'created_at' => $movement->created_at?->format('Y-m-d H:i'),
            ])
            ->all();
    }
}
