<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_categories(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)
            ->get(route('categories.index'))
            ->assertOk();
    }

    public function test_cashier_cannot_view_or_create_categories(): void
    {
        $cashier = User::factory()->cashier()->create();

        $this->actingAs($cashier)
            ->get(route('categories.index'))
            ->assertForbidden();

        $this->actingAs($cashier)
            ->post(route('categories.store'), [
                'name' => 'Snacks',
            ])
            ->assertForbidden();
    }

    public function test_owner_can_create_a_category(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)
            ->post(route('categories.store'), [
                'name' => 'Snacks',
                'is_active' => 1,
            ])
            ->assertRedirect(route('categories.index'));

        $this->assertDatabaseHas('categories', [
            'name' => 'Snacks',
            'is_active' => 1,
        ]);
    }

    public function test_owner_cannot_create_a_duplicate_category_name(): void
    {
        $owner = User::factory()->owner()->create();
        Category::factory()->create(['name' => 'Drinks']);

        $this->actingAs($owner)
            ->from(route('categories.index'))
            ->post(route('categories.store'), [
                'name' => 'Drinks',
            ])
            ->assertRedirect(route('categories.index'))
            ->assertSessionHasErrors('name');
    }

    public function test_owner_can_deactivate_a_category(): void
    {
        $owner = User::factory()->owner()->create();
        $category = Category::factory()->create(['name' => 'Food']);

        $this->actingAs($owner)
            ->patch(route('categories.update', $category), [
                'name' => $category->name,
                'is_active' => 0,
            ])
            ->assertRedirect(route('categories.index'));

        $this->assertFalse($category->refresh()->is_active);
    }
}
