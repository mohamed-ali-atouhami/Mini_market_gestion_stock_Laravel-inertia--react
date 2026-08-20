import PurchaseForm from '@/Components/forms/PurchaseForm';
import { CategoryOption, ShopPurchase } from '@/types';

type SupplierOption = {
    id: number;
    name: string;
};

export default function Edit({
    suppliers,
    categories,
    purchase,
}: {
    suppliers: SupplierOption[];
    categories: CategoryOption[];
    purchase: ShopPurchase;
}) {
    return (
        <PurchaseForm
            suppliers={suppliers}
            categories={categories}
            purchase={purchase}
        />
    );
}
