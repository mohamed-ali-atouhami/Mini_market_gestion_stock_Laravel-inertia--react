<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Purchase;
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
                    'image_url' => $product->imageUrl(),
                ])
                ->all();
        }

        $topSelling = SaleItem::query()
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
            ->whereDate('sales.created_at', $today)
            ->groupBy('sale_items.product_id', 'products.name', 'products.image_path')
            ->orderByDesc('quantity')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->product_id,
                'name' => $row->name,
                'quantity' => Formats::decimal($row->quantity, 3),
                'total' => Formats::money($row->total),
                'image_url' => Product::storedImageUrl($row->image_path),
            ])
            ->all();

        $weekStart = now()->subDays(6)->toDateString();

        $salesByDay = Sale::query()
            ->selectRaw('DATE(created_at) as day, SUM(total) as total')
            ->where('status', Sale::STATUS_COMPLETED)
            ->whereDate('created_at', '>=', $weekStart)
            ->whereDate('created_at', '<=', $today)
            ->groupBy('day')
            ->pluck('total', 'day');

        $purchasesByDay = Purchase::query()
            ->selectRaw('DATE(purchase_date) as day, SUM(total) as total')
            ->where('status', Purchase::STATUS_RECEIVED)
            ->whereDate('purchase_date', '>=', $weekStart)
            ->whereDate('purchase_date', '<=', $today)
            ->groupBy('day')
            ->pluck('total', 'day');

        $week = collect(range(0, 6))->map(function (int $offset) use ($salesByDay, $purchasesByDay) {
            $date = now()->subDays(6 - $offset);
            $day = $date->toDateString();

            return [
                'day' => $day,
                'label' => $date->format('d/m'),
                'sales' => (float) ($salesByDay[$day] ?? 0),
                'purchases' => (float) ($purchasesByDay[$day] ?? 0),
            ];
        })->all();

        $categoryRows = Product::query()
            ->select([
                'categories.id',
                'categories.name',
                DB::raw('SUM(products.stock_quantity) as quantity'),
            ])
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->where('products.is_active', true)
            ->groupBy('categories.id', 'categories.name')
            ->havingRaw('SUM(products.stock_quantity) > 0')
            ->orderByDesc('quantity')
            ->get();

        $categoryTotal = (float) $categoryRows->sum('quantity');

        $stockByCategory = $categoryRows
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'name' => $row->name,
                'quantity' => Formats::decimal($row->quantity, 3),
                'percent' => $categoryTotal > 0
                    ? (int) round(((float) $row->quantity / $categoryTotal) * 100)
                    : 0,
            ])
            ->all();

        $recentPurchases = Purchase::query()
            ->with('supplier')
            ->where('status', Purchase::STATUS_RECEIVED)
            ->latest('id')
            ->limit(3)
            ->get()
            ->map(fn (Purchase $purchase) => [
                'id' => $purchase->id,
                'reference' => $purchase->reference,
                'supplier' => $purchase->supplier?->name,
                'purchase_date' => $purchase->purchase_date?->format('d/m/Y'),
                'total' => Formats::money($purchase->total),
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
            'week' => $week,
            'stock_by_category' => $stockByCategory,
            'recent_purchases' => $recentPurchases,
        ]);
    }
}
