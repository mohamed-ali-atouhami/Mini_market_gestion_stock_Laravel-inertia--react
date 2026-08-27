import Pagination from '@/Components/tables/Pagination';
import { PurchasesTable } from '@/Components/tables/PurchasesTable';
import TableSearch from '@/Components/tables/TableSearch';
import { TableColumn } from '@/Components/tables/Table';
import { ButtonLink } from '@/Components/ui/button';
import { useT } from '@/lib/i18n';
import { Paginated, ShopPurchase } from '@/types';
import { Plus } from 'lucide-react';

const getColumns = (
    t: (key: string, replace?: Record<string, string | number>) => string,
): TableColumn[] => [
    {
        header: t('Reference'),
        accessor: 'reference',
        sortable: true,
    },
    {
        header: t('Supplier'),
        accessor: 'supplier',
    },
    {
        header: t('Date'),
        accessor: 'purchase_date',
        className: 'hidden md:table-cell',
        sortable: true,
    },
    {
        header: t('Total'),
        accessor: 'total',
        className: 'hidden md:table-cell',
        sortable: true,
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
                { value: 'draft', label: t('Draft') },
                { value: 'received', label: t('Received') },
                { value: 'cancelled', label: t('Cancelled') },
            ],
        },
    },
    {
        header: t('Actions'),
        accessor: 'actions',
    },
];

export default function Index({
    purchases,
}: {
    purchases: Paginated<ShopPurchase>;
}) {
    const t = useT();

    return (
        <>
            <div className="space-y-6">
                {/* <div>
                    <h1 className="text-3xl font-bold">Purchases</h1>
                </div> */}

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
                        <h2 className="hidden text-lg font-semibold md:block">
                            {t('All Deliveries')}
                        </h2>
                        <div className="flex w-full flex-col items-center gap-4 md:w-auto md:flex-row">
                            <TableSearch placeholder={t('Search by reference, invoice, or supplier...')} />
                            <ButtonLink href={route('purchases.create')}>
                                <Plus className="h-4 w-4" />
                                {t('New delivery')}
                            </ButtonLink>
                        </div>
                    </div>
                    <PurchasesTable
                        purchases={purchases.data}
                        columns={getColumns(t)}
                    />
                    <Pagination
                        page={purchases.current_page}
                        totalCount={purchases.total}
                    />
                </div>
            </div>
        </>
    );
}
