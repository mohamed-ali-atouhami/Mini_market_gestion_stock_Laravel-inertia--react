import PurchaseForm from '@/Components/forms/PurchaseForm';
import PosLayout from '@/Layouts/PosLayout';
import { CategoryOption, PurchaseProduct } from '@/types';
import { ReactNode } from 'react';

type SupplierOption = {
    id: number;
    name: string;
};

function Create({
    suppliers,
    categories,
    products,
}: {
    suppliers: SupplierOption[];
    categories: CategoryOption[];
    products: PurchaseProduct[];
}) {
    return (
        <PurchaseForm
            suppliers={suppliers}
            categories={categories}
            products={products}
        />
    );
}

Create.layout = (page: ReactNode) => (
    <PosLayout till="delivery">{page}</PosLayout>
);

export default Create;
