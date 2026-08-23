<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner();
    }

    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, Product $product): bool
    {
        return $user->isOwner();
    }

    public function adjust(User $user, Product $product): bool
    {
        return $user->isOwner();
    }
}
