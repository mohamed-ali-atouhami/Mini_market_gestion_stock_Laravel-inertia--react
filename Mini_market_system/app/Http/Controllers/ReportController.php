<?php

namespace App\Http\Controllers;

use App\Models\CashSession;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Support\Formats;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $from = $request->date('from')?->toDateString() ?? now()->startOfMonth()->toDateString();
        $to = $request->date('to')?->toDateString() ?? now()->toDateString();

        if ($from > $to) {
            [$from, $to] = [$to, $from];
        }

        $salesQuery = Sale::query()
            ->where('status', Sale::STATUS_COMPLETED)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to);

        $salesTotal = (float) (clone $salesQuery)->sum('total');
        $ticketCount = (clone $salesQuery)->count();

        $profit = (float) SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.status', Sale::STATUS_COMPLETED)
            ->whereDate('sales.created_at', '>=', $from)
            ->whereDate('sales.created_at', '<=', $to)
            ->selectRaw('COALESCE(SUM((sale_items.unit_price - sale_items.unit_cost) * sale_items.quantity), 0) as profit')
            ->value('profit');

        $purchasesTotal = (float) Purchase::query()
            ->where('status', Purchase::STATUS_RECEIVED)
            ->whereDate('purchase_date', '>=', $from)
            ->whereDate('purchase_date', '<=', $to)
            ->sum('total');

        $salesByDay = Sale::query()
            ->selectRaw('DATE(created_at) as day, COUNT(*) as tickets, SUM(total) as total')
            ->where('status', Sale::STATUS_COMPLETED)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => [
                'day' => $row->day,
                'tickets' => (int) $row->tickets,
                'total' => Formats::money($row->total),
            ])
            ->all();

        $purchasesBySupplier = Purchase::query()
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

        $sessions = CashSession::query()
            ->with('user')
            ->whereDate('opened_at', '>=', $from)
            ->whereDate('opened_at', '<=', $to)
            ->orderByDesc('id')
            ->limit(20)
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

        $movements = StockMovement::query()
            ->with(['product', 'user', 'reference'])
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->orderByDesc('id')
            ->limit(30)
            ->get()
            ->map(fn (StockMovement $movement) => [
                'id' => $movement->id,
                'product' => $movement->product?->name,
                'image_url' => $movement->product?->imageUrl(),
                'type' => $movement->typeLabel(),
                'direction' => $movement->direction,
                'quantity' => Formats::decimal($movement->quantity, 3),
                'reason' => $movement->reason,
                'user' => $movement->user?->name,
                'created_at' => $movement->created_at?->format('Y-m-d H:i'),
            ])
            ->all();

        return Inertia::render('Reports/Index', [
            'filters' => [
                'from' => $from,
                'to' => $to,
            ],
            'summary' => [
                'sales_total' => Formats::money($salesTotal),
                'ticket_count' => $ticketCount,
                'profit' => Formats::money($profit),
                'purchases_total' => Formats::money($purchasesTotal),
            ],
            'sales_by_day' => $salesByDay,
            'purchases_by_supplier' => $purchasesBySupplier,
            'sessions' => $sessions,
            'movements' => $movements,
        ]);
    }
}
