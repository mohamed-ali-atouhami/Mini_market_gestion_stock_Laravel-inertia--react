import Pagination from '@/Components/tables/Pagination';
import { StockTable } from '@/Components/tables/StockTable';
import TableSearch from '@/Components/tables/TableSearch';
import { TableColumn } from '@/Components/tables/Table';
import { Paginated, ShopStockProduct } from '@/types';

const getColumns = (): TableColumn[] => [
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
        header: 'Min stock',
        accessor: 'min_stock',
        sortable: true,
    },
    {
        header: 'Actions',
        accessor: 'actions',
    },
];

export default function Index({
    products,
}: {
    products: Paginated<ShopStockProduct>;
}) {
    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Stock</h1>
                    <p className="mt-1 text-muted-foreground">
                        Red means stock is at or below min stock. Open History
                        to adjust.
                    </p>
                </div>

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
                        <h2 className="hidden text-lg font-semibold md:block">
                            All products
                        </h2>
                        <TableSearch placeholder="Search by name or barcode..." />
                    </div>
                    <StockTable
                        products={products.data}
                        columns={getColumns()}
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
