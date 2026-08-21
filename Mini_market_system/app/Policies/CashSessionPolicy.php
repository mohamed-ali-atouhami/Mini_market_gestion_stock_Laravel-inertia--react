<?php

namespace App\Policies;

use App\Models\CashSession;
use App\Models\User;

class CashSessionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner() || $user->isCashier();
    }

    public function view(User $user, CashSession $cashSession): bool
    {
        return $user->isOwner() || $cashSession->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isOwner() || $user->isCashier();
    }

    public function close(User $user, CashSession $cashSession): bool
    {
        if ($cashSession->status !== CashSession::STATUS_OPEN) {
            return false;
        }

        return $user->isOwner() || $cashSession->user_id === $user->id;
    }
}
