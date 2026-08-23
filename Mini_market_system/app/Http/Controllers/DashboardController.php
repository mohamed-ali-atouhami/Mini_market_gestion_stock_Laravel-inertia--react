<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Setting;
use App\Support\Formats;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $today = now()->toDateString();
        $settings = Setting::current();

        $sales = Sale::query()
            ->where('status', Sale::STATUS_COMPLETED)
            ->whereDate('created_at', $today);

        $salesTotal = (float) (clone $sales)->sum('total');
        $ticketCount = (clone $sales)->count();

        $stockValue = (float) Product::query()
            ->selectRaw('COALESCE(SUM(stock_quantity * cost_price), 0) as value')
            ->value('value');

        $lowStock = [];

        if ($settings->low_stock_enabled) {
            $lowStock = Product::query()
                ->where('is_active', true)
                ->whereColumn('stock_quantity', '<=', 'min_stock')
                ->orderBy('name')
                ->limit(8)
                ->get()
                ->map(fn (Product $product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'stock_quantity' => Formats::decimal($product->stock_quantity, 3),
                    'min_stock' => Formats::decimal($product->min_stock, 3),
                ])
                ->all();
        }

        $topSelling = SaleItem::query()
            ->select([
                'products.name',
                DB::raw('SUM(sale_items.quantity) as quantity'),
                DB::raw('SUM(sale_items.quantity * sale_items.unit_price) as total'),
            ])
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.status', Sale::STATUS_COMPLETED)
            ->whereDate('sales.created_at', $today)
            ->groupBy('sale_items.product_id', 'products.name')
            ->orderByDesc('quantity')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'quantity' => Formats::decimal($row->quantity, 3),
                'total' => Formats::money($row->total),
            ])
            ->all();

        return Inertia::render('Dashboard', [
            'today' => [
                'sales_total' => Formats::money($salesTotal),
                'ticket_count' => $ticketCount,
            ],
            'stock_value' => Formats::money($stockValue),
            'low_stock' => $lowStock,
            'top_selling' => $topSelling,
        ]);
    }
}
