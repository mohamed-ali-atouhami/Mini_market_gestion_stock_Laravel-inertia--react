import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { User } from '@/types';
import { router } from '@inertiajs/react';
import { ChevronDown, Settings, UserRound } from 'lucide-react';

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
}

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
                <Avatar className="rounded-full after:rounded-full">
                    <AvatarFallback className="rounded-full bg-primary text-xs text-primary-foreground">
                        {initials(user.name)}
                    </AvatarFallback>
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