import PurchaseForm from '@/Components/forms/PurchaseForm';
import { CategoryOption } from '@/types';

type SupplierOption = {
    id: number;
    name: string;
};

export default function Create({
    suppliers,
    categories,
}: {
    suppliers: SupplierOption[];
    categories: CategoryOption[];
}) {
    return (
        <PurchaseForm suppliers={suppliers} categories={categories} />
    );
}
