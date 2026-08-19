import CategoryForm from '@/Components/forms/CategoryForm';
import ProductForm from '@/Components/forms/ProductForm';
import SupplierForm from '@/Components/forms/SupplierForm';
import UserForm from '@/Components/forms/UserForm';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    CategoryOption,
    RoleOption,
    ShopCategory,
    ShopProduct,
    ShopSupplier,
    ShopUser,
} from '@/types';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export type FormTable = 'users' | 'categories' | 'suppliers' | 'products';

type FormRecord = ShopUser | ShopCategory | ShopSupplier | ShopProduct;

const TABLE_COPY: Record<
    FormTable,
    { singular: string; create: string; edit: string }
> = {
    users: {
        singular: 'user',
        create: 'Add a person who can log in to the shop.',
        edit: 'Update this account.',
    },
    categories: {
        singular: 'category',
        create: 'Add a product category such as Drinks or Food.',
        edit: 'Update this category.',
    },
    suppliers: {
        singular: 'supplier',
        create: 'Add who you buy from.',
        edit: 'Update this supplier.',
    },
    products: {
        singular: 'product',
        create: 'Scan the barcode once, then save the prices.',
        edit: 'Update this product. Stock stays as it is.',
    },
};

export type FormModalProps = {
    table: FormTable;
    type: 'create' | 'edit';
    data?: FormRecord | null;
    relatedData?: {
        roles?: RoleOption[];
        categories?: CategoryOption[];
    };
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

export default function FormModal({
    table,
    type,
    data,
    relatedData,
    open: openProp,
    onOpenChange,
}: FormModalProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const isControlled = openProp !== undefined;
    const open = isControlled ? openProp : uncontrolledOpen;
    const setOpen = (next: boolean) => {
        if (!isControlled) {
            setUncontrolledOpen(next);
        }
        onOpenChange?.(next);
    };
    const copy = TABLE_COPY[table];
    const roles = relatedData?.roles ?? [];
    const categories = relatedData?.categories ?? [];

    return (
        <>
            {!isControlled && type === 'create' ? (
                <Button onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Create {copy.singular}
                </Button>
            ) : null}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {type === 'create' ? 'Create' : 'Edit'}{' '}
                            {copy.singular}
                        </DialogTitle>
                        <DialogDescription>
                            {type === 'create' ? copy.create : copy.edit}
                        </DialogDescription>
                    </DialogHeader>
                    {open && table === 'users' && (
                        <UserForm
                            type={type}
                            data={data as ShopUser | null}
                            roles={roles}
                            setOpen={setOpen}
                        />
                    )}
                    {open && table === 'categories' && (
                        <CategoryForm
                            type={type}
                            data={data as ShopCategory | null}
                            setOpen={setOpen}
                        />
                    )}
                    {open && table === 'suppliers' && (
                        <SupplierForm
                            type={type}
                            data={data as ShopSupplier | null}
                            setOpen={setOpen}
                        />
                    )}
                    {open && table === 'products' && (
                        <ProductForm
                            type={type}
                            data={data as ShopProduct | null}
                            categories={categories}
                            setOpen={setOpen}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
