<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    private const PER_PAGE = 10;

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $search = $request->string('search')->toString();
        $role = $request->string('role')->toString();
        $status = $request->string('status')->toString();
        $sort = $request->string('sort')->toString();
        $order = $request->string('order')->toString() === 'desc' ? 'desc' : 'asc';

        $query = User::query()->with('role');

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', '%'.$search.'%')
                    ->orWhere('username', 'like', '%'.$search.'%');
            });
        }

        if ($role !== '' && $role !== 'ALL') {
            $query->whereHas('role', fn ($builder) => $builder->where('slug', $role));
        }

        if ($status === 'ACTIVE') {
            $query->where('is_active', true);
        } elseif ($status === 'INACTIVE') {
            $query->where('is_active', false);
        }

        $sortColumn = in_array($sort, ['name', 'username'], true) ? $sort : 'name';

        $users = $query
            ->orderBy($sortColumn, $order)
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role?->name,
                'role_id' => $user->role_id,
                'is_active' => $user->is_active,
            ]);

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $this->roleOptions(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('Users/Create', [
            'roles' => $this->roleOptions(),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['is_active'] = $request->boolean('is_active', true);

        User::query()->create($data);

        return redirect()
            ->route('users.index')
            ->with('status', 'User created.');
    }

    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        $user->load('role');

        return Inertia::render('Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role_id' => $user->role_id,
                'is_active' => $user->is_active,
            ],
            'roles' => $this->roleOptions(),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        if ($user->is($request->user()) && ! $request->boolean('is_active')) {
            throw ValidationException::withMessages([
                'is_active' => 'You cannot disable your own account.',
            ]);
        }

        $newRole = Role::query()->findOrFail($request->integer('role_id'));

        if (
            $user->isOwner()
            && $newRole->slug !== Role::OWNER
            && ! $this->hasAnotherActiveOwner($user)
        ) {
            throw ValidationException::withMessages([
                'role_id' => 'There must be at least one active owner.',
            ]);
        }

        $data = $request->safe()->except(['password']);
        $data['is_active'] = $request->boolean('is_active');

        if ($request->filled('password')) {
            $data['password'] = $request->string('password');
        }

        $user->update($data);

        return redirect()
            ->route('users.index')
            ->with('status', 'User updated.');
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    private function roleOptions(): array
    {
        return Role::query()
            ->orderBy('id')
            ->get(['id', 'name'])
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
            ])
            ->all();
    }

    private function hasAnotherActiveOwner(User $user): bool
    {
        $ownerRoleId = Role::query()->where('slug', Role::OWNER)->value('id');

        return User::query()
            ->where('role_id', $ownerRoleId)
            ->where('is_active', true)
            ->where('id', '!=', $user->id)
            ->exists();
    }
}
