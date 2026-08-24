import FormModal from '@/Components/forms/FormModal';
import Pagination from '@/Components/tables/Pagination';
import TableSearch from '@/Components/tables/TableSearch';
import { TableColumn } from '@/Components/tables/Table';
import { ProductsTable } from '@/Components/tables/ProductsTable';
import { CategoryOption, Paginated, ShopProduct } from '@/types';

const getColumns = (categories: CategoryOption[]): TableColumn[] => [
    {
        header: 'Name',
        accessor: 'name',
        sortable: true,
    },
    {
        header: 'Barcode',
        accessor: 'barcode',
        className: 'hidden md:table-cell',
        sortable: true,
    },
    {
        header: 'Category',
        accessor: 'category',
        filter: {
            type: 'select',
            paramKey: 'category',
            defaultValue: 'ALL',
            options: [
                { value: 'ALL', label: 'All categories' },
                ...categories.map((category) => ({
                    value: String(category.id),
                    label: category.name,
                })),
            ],
        },
    },
    {
        header: 'Sale price',
        accessor: 'sale_price',
        className: 'hidden md:table-cell',
        sortable: true,
    },
    {
        header: 'Stock',
        accessor: 'stock_quantity',
        sortable: true,
        filter: {
            type: 'select',
            paramKey: 'stock',
            defaultValue: 'ALL',
            options: [
                { value: 'ALL', label: 'All stock' },
                { value: 'LOW', label: 'Low stock' },
                { value: 'OK', label: 'OK' },
            ],
        },
    },
    {
        header: 'Status',
        accessor: 'status',
        filter: {
            type: 'select',
            paramKey: 'status',
            defaultValue: 'ALL',
            options: [
                { value: 'ALL', label: 'All status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Disabled' },
            ],
        },
    },
    {
        header: 'Actions',
        accessor: 'actions',
    },
];

export default function Index({
    products,
    categories,
}: {
    products: Paginated<ShopProduct>;
    categories: CategoryOption[];
}) {
    return (
        <>
            <div className="space-y-6">
                {/* <div>
                    <h1 className="text-3xl font-bold">Products</h1>
                </div> */}

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
                        <h2 className="hidden text-lg font-semibold md:block">
                            All Products
                        </h2>
                        <div className="flex w-full flex-col items-center gap-4 md:w-auto md:flex-row">
                            <TableSearch placeholder="Search by name or barcode..." />
                            <FormModal
                                table="products"
                                type="create"
                                relatedData={{ categories }}
                            />
                        </div>
                    </div>
                    <ProductsTable
                        products={products.data}
                        columns={getColumns(categories)}
                        categories={categories}
                    />
                    <Pagination
                        page={products.current_page}
                        totalCount={products.total}
                    />
                </div>
            </div>
        </>
    );
}
