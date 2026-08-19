<?php

namespace Database\Factories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'username' => fake()->unique()->numerify('user####'),
            'password' => static::$password ??= Hash::make('password'),
            'role_id' => $this->cashierRole()->id,
            'is_active' => true,
            'remember_token' => Str::random(10),
        ];
    }

    public function owner(): static
    {
        return $this->state(fn (array $attributes) => [
            'role_id' => $this->ownerRole()->id,
        ]);
    }

    public function cashier(): static
    {
        return $this->state(fn (array $attributes) => [
            'role_id' => $this->cashierRole()->id,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    private function ownerRole(): Role
    {
        return Role::query()->firstOrCreate(
            ['slug' => Role::OWNER],
            ['name' => 'Owner'],
        );
    }

    private function cashierRole(): Role
    {
        return Role::query()->firstOrCreate(
            ['slug' => Role::CASHIER],
            ['name' => 'Cashier'],
        );
    }
}
