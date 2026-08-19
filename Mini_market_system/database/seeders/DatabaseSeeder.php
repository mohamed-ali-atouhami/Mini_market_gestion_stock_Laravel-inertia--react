<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $ownerRole = Role::query()->where('slug', Role::OWNER)->firstOrFail();

        User::query()->updateOrCreate(
            ['username' => 'owner'],
            [
                'name' => 'Owner',
                'password' => 'password',
                'role_id' => $ownerRole->id,
                'is_active' => true,
            ],
        );

        $this->call(ShopDemoSeeder::class);
    }
}
