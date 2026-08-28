import PurchaseForm from '@/Components/forms/PurchaseForm';
import PosLayout from '@/Layouts/PosLayout';
import { CategoryOption, PurchaseProduct, ShopPurchase } from '@/types';
import { ReactNode } from 'react';

type SupplierOption = {
    id: number;
    name: string;
};

function Edit({
    suppliers,
    categories,
    products,
    purchase,
}: {
    suppliers: SupplierOption[];
    categories: CategoryOption[];
    products: PurchaseProduct[];
    purchase: ShopPurchase;
}) {
    return (
        <PurchaseForm
            suppliers={suppliers}
            categories={categories}
            products={products}
            purchase={purchase}
        />
    );
}

Edit.layout = (page: ReactNode) => (
    <PosLayout till="delivery">{page}</PosLayout>
);

export default Edit;
