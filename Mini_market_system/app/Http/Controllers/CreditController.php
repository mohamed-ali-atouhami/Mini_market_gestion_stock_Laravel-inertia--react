<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCreditPaymentRequest;
use App\Models\Sale;
use App\Models\Setting;
use App\Services\SaleService;
use App\Support\Formats;
use App\Support\Phone;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CreditController extends Controller
{
    public function __construct(private SaleService $sales)
    {
    }

    public function index(): Response
    {
        $this->authorize('viewCredits', Sale::class);

        $shopName = Setting::current()->shop_name ?? 'Mini market';

        $credits = Sale::query()
            ->with(['customer', 'user'])
            ->where('status', Sale::STATUS_COMPLETED)
            ->where('payment_method', Sale::PAYMENT_CREDIT)
            ->where('remaining_amount', '>', 0)
            ->orderBy('due_date')
            ->orderBy('id')
            ->get()
            ->map(fn (Sale $sale) => self::payload($sale, $shopName))
            ->all();

        return Inertia::render('Credits/Index', [
            'credits' => $credits,
        ]);
    }

    public function storePayment(StoreCreditPaymentRequest $request, Sale $sale): RedirectResponse
    {
        $this->sales->collectCredit(
            $request->user(),
            $sale,
            $request->validated('amount'),
        );

        return redirect()
            ->route('credits.index')
            ->with('status', 'Payment recorded.');
    }

    /**
     * @return array<string, mixed>
     */
    public static function payload(Sale $sale, ?string $shopName = null): array
    {
        $sale->loadMissing(['customer', 'user']);
        $remaining = Formats::money($sale->remaining_amount);
        $due = $sale->due_date?->format('d/m/Y');
        $name = $sale->customer?->name ?? 'Customer';
        $shop = $shopName ?? 'Mini market';
        $message = 'السلام عليكم '.$name.'،'."\n"
            .'تذكير لطيف من يونس '.$shop.' بأن المبلغ المتبقي هو '.$remaining.' درهم'."\n"
            .($due ? '،كما اتفقنا موعد التسديد هو '.$due : '')
            .'.'."\n"
            .'يسعدنا استقبالكم في المحل للدفع. شكراً لثقتكم.';

        return [
            'id' => $sale->id,
            'reference' => $sale->reference,
            'customer' => $name,
            'phone' => $sale->customer?->phone,
            'cashier' => $sale->user?->name,
            'total' => Formats::money($sale->total),
            'paid_at_sale' => Formats::money($sale->amount_paid),
            'remaining' => $remaining,
            'due_date' => $due,
            'due_date_iso' => $sale->due_date?->toDateString(),
            'is_overdue' => $sale->due_date !== null && $sale->due_date->lt(now()->startOfDay()),
            'whatsapp_url' => $sale->customer?->phone
                ? Phone::whatsappUrl($sale->customer->phone, $message)
                : null,
        ];
    }
}
