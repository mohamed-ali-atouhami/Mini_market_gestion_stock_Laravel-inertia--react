<?php

namespace App\Policies;

use App\Models\Purchase;
use App\Models\User;

class PurchasePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner();
    }

    public function view(User $user, Purchase $purchase): bool
    {
        return $user->isOwner();
    }

    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, Purchase $purchase): bool
    {
        return $user->isOwner() && $purchase->status === Purchase::STATUS_DRAFT;
    }

    public function receive(User $user, Purchase $purchase): bool
    {
        return $user->can('receive-purchases')
            && $purchase->status === Purchase::STATUS_DRAFT;
    }

    public function cancel(User $user, Purchase $purchase): bool
    {
        return $user->isOwner() && $purchase->status === Purchase::STATUS_DRAFT;
    }
}
