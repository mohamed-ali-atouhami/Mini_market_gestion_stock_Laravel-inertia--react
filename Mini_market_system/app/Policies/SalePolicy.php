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
        return $user->isOwner() || $sale->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isOwner() || $user->isCashier();
    }
}
