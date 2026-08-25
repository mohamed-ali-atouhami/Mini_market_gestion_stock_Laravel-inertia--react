<?php

namespace App\Policies;

use App\Models\User;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner() || $user->isCashier();
    }

    public function create(User $user): bool
    {
        return $user->isOwner() || $user->isCashier();
    }
}
