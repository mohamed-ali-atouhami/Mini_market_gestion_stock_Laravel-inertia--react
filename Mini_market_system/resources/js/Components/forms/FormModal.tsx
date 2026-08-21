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
    ScannedProduct,
} from '@/types';
import { Plus } from 'lucide-react';
import { ReactNode, useState } from 'react';

export type FormTable = 'users' | 'categories' | 'suppliers' | 'products';

type FormRecord = ShopUser | ShopCategory | ShopSupplier | ShopProduct;

const FORM_NAME: Record<FormTable, string> = {
    users: 'user',
    categories: 'category',
    suppliers: 'supplier',
    products: 'product',
};

export type FormModalProps = {
    table: FormTable;
    type: 'create' | 'edit';
    data?: FormRecord | null;
    relatedData?: {
        roles?: RoleOption[];
        categories?: CategoryOption[];
        initialBarcode?: string;
        returnTo?: string;
        onProductCreated?: (product: ScannedProduct) => void;
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
    const name = FORM_NAME[table];
    const forms: Record<FormTable, () => ReactNode> = {
        users: () => (
            <UserForm
                type={type}
                data={data as ShopUser | null}
                roles={relatedData?.roles ?? []}
                setOpen={setOpen}
            />
        ),
        categories: () => (
            <CategoryForm
                type={type}
                data={data as ShopCategory | null}
                setOpen={setOpen}
            />
        ),
        suppliers: () => (
            <SupplierForm
                type={type}
                data={data as ShopSupplier | null}
                setOpen={setOpen}
            />
        ),
        products: () => (
            <ProductForm
                type={type}
                data={data as ShopProduct | null}
                categories={relatedData?.categories ?? []}
                setOpen={setOpen}
                returnTo={relatedData?.returnTo}
                initialBarcode={relatedData?.initialBarcode}
                onCreated={relatedData?.onProductCreated}
            />
        ),
    };

    return (
        <>
            {!isControlled && type === 'create' ? (
                <Button type="button" onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Create {name}
                </Button>
            ) : null}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {type === 'create' ? 'Create' : 'Edit'} {name}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            {type === 'create' ? 'Create' : 'Edit'} {name}
                        </DialogDescription>
                    </DialogHeader>
                    {open ? forms[table]() : null}
                </DialogContent>
            </Dialog>
        </>
    );
}
