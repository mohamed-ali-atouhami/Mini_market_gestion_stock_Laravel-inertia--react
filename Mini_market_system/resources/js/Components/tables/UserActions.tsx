import FormModal from '@/Components/forms/FormModal';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { RoleOption, ShopUser } from '@/types';
import { Edit, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

export function UserActions({
    user,
    roles,
}: {
    user: ShopUser;
    roles: RoleOption[];
}) {
    const [editOpen, setEditOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon-sm" />}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-0">
                    <DropdownMenuItem
                        className="justify-center"
                        onClick={() => setEditOpen(true)}
                    >
                        <Edit className="h-4 w-4" />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <FormModal
                table="users"
                type="edit"
                data={user}
                relatedData={{ roles }}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
        </>
    );
}
