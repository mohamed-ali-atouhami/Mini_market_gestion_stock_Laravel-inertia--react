import Pagination from '@/Components/tables/Pagination';
import { StockTable } from '@/Components/tables/StockTable';
import TableSearch from '@/Components/tables/TableSearch';
import { TableColumn } from '@/Components/tables/Table';
import { useT } from '@/lib/i18n';
import { Paginated, ShopStockProduct } from '@/types';

const getColumns = (
    t: (key: string, replace?: Record<string, string | number>) => string,
): TableColumn[] => [
    {
        header: t('Name'),
        accessor: 'name',
        sortable: true,
    },
    {
        header: t('Barcode'),
        accessor: 'barcode',
        className: 'hidden md:table-cell',
        sortable: true,
    },
    {
        header: t('Stock'),
        accessor: 'stock_quantity',
        sortable: true,
        filter: {
            type: 'select',
            paramKey: 'stock',
            defaultValue: 'ALL',
            options: [
                { value: 'ALL', label: t('All stock') },
                { value: 'LOW', label: t('Low stock') },
                { value: 'OK', label: t('In stock') },
            ],
        },
    },
    {
        header: t('Min stock'),
        accessor: 'min_stock',
        sortable: true,
    },
    {
        header: t('Actions'),
        accessor: 'actions',
    },
];

export default function Index({
    products,
}: {
    products: Paginated<ShopStockProduct>;
}) {
    const t = useT();

    return (
        <>
            <div className="space-y-6">
                <div>
                    {/* <h1 className="text-3xl font-bold">Stock</h1> */}
                    <p className="text-muted-foreground">
                        {t(
                            'Here you can manage the stock of the products. Click on the history button to view the history of the product.',
                        )}
                    </p>
                </div>

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
                        <h2 className="hidden text-lg font-semibold md:block">
                            {t('All products in stock')}
                        </h2>
                        <TableSearch placeholder={t('Search by name or barcode...')} />
                    </div>
                    <StockTable
                        products={products.data}
                        columns={getColumns(t)}
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
