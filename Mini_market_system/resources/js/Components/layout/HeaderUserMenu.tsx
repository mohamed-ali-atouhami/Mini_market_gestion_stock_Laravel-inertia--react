import { Avatar } from '@/Components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { User } from '@/types';
import { router } from '@inertiajs/react';
import { ChevronDown, Settings, UserIcon, UserRound } from 'lucide-react';

export function HeaderUserMenu({ user }: { user: User }) {
    const roleLabel =
        user.role === 'owner'
            ? 'Owner'
            : user.role === 'cashier'
              ? 'Cashier'
              : 'No role';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="ml-auto flex items-center gap-2 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-muted/80 focus-visible:ring-3 focus-visible:ring-ring/50">
                <div className="hidden min-w-0 leading-tight sm:grid">
                    <span className="truncate text-sm font-medium">
                        {user.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground text-center">
                        {user.username} / {roleLabel}
                    </span>
                </div>
                <Avatar className="overflow-hidden rounded-full bg-gray-200 after:rounded-full">
                    <span className="flex size-full items-center justify-center">
                        <UserIcon className="size-4 translate-y-px text-gray-500" />
                    </span>
                </Avatar>
                <ChevronDown className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuItem
                    onClick={() => router.visit(route('profile.edit'))}
                >
                    <UserRound />
                    Profile
                </DropdownMenuItem>
                {user.role === 'owner' ? (
                    <DropdownMenuItem
                        onClick={() =>
                            router.visit(route('settings.edit'))
                        }
                    >
                        <Settings />
                        Settings
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}