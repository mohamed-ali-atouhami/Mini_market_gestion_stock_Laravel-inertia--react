<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::query()->firstOrCreate(
            ['slug' => Role::OWNER],
            ['name' => 'Owner'],
        );

        Role::query()->firstOrCreate(
            ['slug' => Role::CASHIER],
            ['name' => 'Cashier'],
        );
    }
}
