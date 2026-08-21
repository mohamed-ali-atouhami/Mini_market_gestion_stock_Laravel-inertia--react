<?php

namespace App\Http\Controllers;

use App\Http\Requests\CloseCashSessionRequest;
use App\Http\Requests\OpenCashSessionRequest;
use App\Models\CashSession;
use App\Models\Sale;
use App\Services\CashSessionService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CashSessionController extends Controller
{
    public function __construct(private CashSessionService $sessions)
    {
    }

    public function index(): Response
    {
        $this->authorize('viewAny', CashSession::class);

        $user = request()->user();
        $open = $this->sessions->currentOpen($user);
        $salesTotal = 0.0;

        if ($open !== null) {
            $salesTotal = (float) $open->sales()
                ->where('status', Sale::STATUS_COMPLETED)
                ->sum('total');
        }

        $history = CashSession::query()
            ->where('user_id', $user->id)
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn (CashSession $session) => $this->payload($session));

        return Inertia::render('Caisse/Index', [
            'session' => $open ? [
                ...$this->payload($open),
                'sales_total' => number_format($salesTotal, 2, '.', ''),
                'expected_amount' => number_format((float) $open->opening_amount + $salesTotal, 2, '.', ''),
            ] : null,
            'history' => $history,
        ]);
    }

    public function store(OpenCashSessionRequest $request): RedirectResponse
    {
        $this->sessions->open($request->user(), $request->validated('opening_amount'));

        return redirect()
            ->route('caisse.index')
            ->with('status', 'Caisse opened.');
    }

    public function close(CloseCashSessionRequest $request, CashSession $cashSession): RedirectResponse
    {
        $this->sessions->close($cashSession, $request->validated('closing_amount'));

        return redirect()
            ->route('caisse.index')
            ->with('status', 'Caisse closed.');
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(CashSession $session): array
    {
        return [
            'id' => $session->id,
            'status' => $session->status,
            'opened_at' => $session->opened_at?->format('Y-m-d H:i'),
            'closed_at' => $session->closed_at?->format('Y-m-d H:i'),
            'opening_amount' => $this->formatDecimal($session->opening_amount, 2),
            'closing_amount' => $session->closing_amount === null
                ? null
                : $this->formatDecimal($session->closing_amount, 2),
            'expected_amount' => $session->expected_amount === null
                ? null
                : $this->formatDecimal($session->expected_amount, 2),
            'difference' => $session->difference === null
                ? null
                : $this->formatDecimal($session->difference, 2),
        ];
    }

    private function formatDecimal(mixed $value, int $scale): string
    {
        $formatted = number_format((float) $value, $scale, '.', '');
        $formatted = rtrim(rtrim($formatted, '0'), '.');

        return $formatted === '' ? '0' : $formatted;
    }
}
