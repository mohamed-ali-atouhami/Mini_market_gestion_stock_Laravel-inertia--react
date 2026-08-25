<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Shop logins. Password for every account is "password".
     */
    public function run(): void
    {
        $ownerRole = Role::query()->where('slug', Role::OWNER)->firstOrFail();
        $cashierRole = Role::query()->where('slug', Role::CASHIER)->firstOrFail();

        $users = [
            [
                'username' => 'younes',
                'name' => 'Younes mesbahi',
                'role_id' => $ownerRole->id,
                'is_active' => true,
            ],
            [
                'username' => 'rabie',
                'name' => 'Rabie Mesbahi',
                'role_id' => $cashierRole->id,
                'is_active' => true,
            ],
            [
                'username' => 'ahmed',
                'name' => 'Ahmed mesbahi',
                'role_id' => $cashierRole->id,
                'is_active' => false,
            ],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['username' => $user['username']],
                [
                    'name' => $user['name'],
                    'password' => 'password',
                    'role_id' => $user['role_id'],
                    'is_active' => $user['is_active'],
                ],
            );
        }
    }
}
