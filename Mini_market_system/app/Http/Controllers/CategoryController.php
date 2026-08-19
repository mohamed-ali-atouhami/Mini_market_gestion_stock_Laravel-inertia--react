<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    private const PER_PAGE = 10;

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Category::class);

        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $sort = $request->string('sort')->toString();
        $order = $request->string('order')->toString() === 'desc' ? 'desc' : 'asc';

        $query = Category::query();

        if ($search !== '') {
            $query->where('name', 'like', '%'.$search.'%');
        }

        if ($status === 'ACTIVE') {
            $query->where('is_active', true);
        } elseif ($status === 'INACTIVE') {
            $query->where('is_active', false);
        }

        $sortColumn = in_array($sort, ['name'], true) ? $sort : 'name';

        $categories = $query
            ->orderBy($sortColumn, $order)
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'is_active' => $category->is_active,
            ]);

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['is_active'] = $request->boolean('is_active', true);

        Category::query()->create($data);

        return redirect()
            ->route('categories.index')
            ->with('status', 'Category created.');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $data = $request->validated();
        $data['is_active'] = $request->boolean('is_active');

        $category->update($data);

        return redirect()
            ->route('categories.index')
            ->with('status', 'Category updated.');
    }
}
