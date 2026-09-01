<?php

namespace App\Policies;

use App\Models\CustomerReturn;
use App\Models\User;

class CustomerReturnPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner() || $user->isCashier();
    }

    public function create(User $user): bool
    {
        return $user->isOwner() || $user->isCashier();
    }

    public function giveToSupplier(User $user, CustomerReturn $customerReturn): bool
    {
        return $user->isOwner() || $user->isCashier();
    }
}
