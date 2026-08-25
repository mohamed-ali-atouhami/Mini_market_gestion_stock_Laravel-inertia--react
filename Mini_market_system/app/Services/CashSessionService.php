<?php

namespace App\Services;

use App\Models\CashSession;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CashSessionService
{
    public function currentOpen(User $user): ?CashSession
    {
        return CashSession::query()
            ->where('user_id', $user->id)
            ->where('status', CashSession::STATUS_OPEN)
            ->first();
    }

    public function open(User $user, float|int|string $openingAmount): CashSession
    {
        try {
            return DB::transaction(function () use ($user, $openingAmount) {
                $existing = CashSession::query()
                    ->where('user_id', $user->id)
                    ->where('status', CashSession::STATUS_OPEN)
                    ->lockForUpdate()
                    ->first();

                if ($existing !== null) {
                    throw ValidationException::withMessages([
                        'opening_amount' => 'Close the current caisse before opening a new one.',
                    ]);
                }

                return CashSession::query()->create([
                    'user_id' => $user->id,
                    'opened_at' => now(),
                    'opening_amount' => $openingAmount,
                    'status' => CashSession::STATUS_OPEN,
                ]);
            });
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'opening_amount' => 'Close the current caisse before opening a new one.',
            ]);
        }
    }

    public function close(CashSession $session, float|int|string $closingAmount): CashSession
    {
        if ($session->status !== CashSession::STATUS_OPEN) {
            throw ValidationException::withMessages([
                'closing_amount' => 'This caisse is already closed.',
            ]);
        }

        return DB::transaction(function () use ($session, $closingAmount) {
            $locked = CashSession::query()->lockForUpdate()->findOrFail($session->id);
            $expected = round((float) $locked->opening_amount + $locked->cashInDrawer(), 2);
            $counted = round((float) $closingAmount, 2);

            $locked->update([
                'closed_at' => now(),
                'closing_amount' => $counted,
                'expected_amount' => $expected,
                'difference' => round($counted - $expected, 2),
                'status' => CashSession::STATUS_CLOSED,
            ]);

            return $locked->refresh();
        });
    }
}
