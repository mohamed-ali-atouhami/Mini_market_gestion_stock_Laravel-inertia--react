import FormModal, { FormTable } from '@/Components/forms/FormModal';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    CategoryOption,
    RoleOption,
    ShopCategory,
    ShopProduct,
    ShopSupplier,
    ShopUser,
} from '@/types';
import { Edit, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

export function RowActions({
    table,
    data,
    relatedData,
}: {
    table: FormTable;
    data: ShopUser | ShopCategory | ShopSupplier | ShopProduct;
    relatedData?: {
        roles?: RoleOption[];
        categories?: CategoryOption[];
    };
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
                table={table}
                type="edit"
                data={data}
                relatedData={relatedData}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
        </>
    );
}
