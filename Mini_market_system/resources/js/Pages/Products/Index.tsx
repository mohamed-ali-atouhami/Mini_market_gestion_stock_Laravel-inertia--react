import FormModal from '@/Components/forms/FormModal';
import Pagination from '@/Components/tables/Pagination';
import TableSearch from '@/Components/tables/TableSearch';
import { TableColumn } from '@/Components/tables/Table';
import { ProductsTable } from '@/Components/tables/ProductsTable';
import { useT } from '@/lib/i18n';
import { CategoryOption, Paginated, ShopProduct } from '@/types';

const getColumns = (
    t: (key: string, replace?: Record<string, string | number>) => string,
    categories: CategoryOption[],
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
        header: t('Category'),
        accessor: 'category',
        filter: {
            type: 'select',
            paramKey: 'category',
            defaultValue: 'ALL',
            options: [
                { value: 'ALL', label: t('All categories') },
                ...categories.map((category) => ({
                    value: String(category.id),
                    label: category.name,
                })),
            ],
        },
    },
    {
        header: t('Sale price'),
        accessor: 'sale_price',
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
        header: t('Status'),
        accessor: 'status',
        filter: {
            type: 'select',
            paramKey: 'status',
            defaultValue: 'ALL',
            options: [
                { value: 'ALL', label: t('All status') },
                { value: 'ACTIVE', label: t('Active') },
                { value: 'INACTIVE', label: t('Disabled') },
            ],
        },
    },
    {
        header: t('Actions'),
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
    const t = useT();

    return (
        <>
            <div className="space-y-6">
                {/* <div>
                    <h1 className="text-3xl font-bold">Products</h1>
                </div> */}

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
                        <h2 className="hidden text-lg font-semibold md:block">
                            {t('All Products')}
                        </h2>
                        <div className="flex w-full flex-col items-center gap-4 md:w-auto md:flex-row">
                            <TableSearch placeholder={t('Search by name or barcode...')} />
                            <FormModal
                                table="products"
                                type="create"
                                relatedData={{ categories }}
                            />
                        </div>
                    </div>
                    <ProductsTable
                        products={products.data}
                        columns={getColumns(t, categories)}
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
