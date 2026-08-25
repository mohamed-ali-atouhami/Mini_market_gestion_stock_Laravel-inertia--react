<?php

namespace App\Policies;

use App\Models\Sale;
use App\Models\User;

class SalePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner();
    }

    public function view(User $user, Sale $sale): bool
    {
        if ($user->isOwner() || $sale->user_id === $user->id) {
            return true;
        }

        return $user->isCashier() && $sale->isCredit();
    }

    public function collectCredit(User $user, Sale $sale): bool
    {
        return ($user->isOwner() || $user->isCashier()) && $sale->isCredit();
    }

    public function viewCredits(User $user): bool
    {
        return $user->isOwner() || $user->isCashier();
    }

    public function create(User $user): bool
    {
        return $user->isOwner() || $user->isCashier();
    }
}
