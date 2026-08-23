<?php

namespace App\Policies;

use App\Models\Setting;
use App\Models\User;

class SettingPolicy
{
    public function view(User $user, Setting $setting): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, Setting $setting): bool
    {
        return $user->isOwner();
    }
}
