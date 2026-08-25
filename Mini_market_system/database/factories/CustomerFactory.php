<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Support\Phone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $phone = fake()->unique()->numerify('06########');

        return [
            'name' => fake()->name(),
            'phone' => $phone,
            'phone_normalized' => Phone::normalize($phone),
            'is_active' => true,
        ];
    }
}
