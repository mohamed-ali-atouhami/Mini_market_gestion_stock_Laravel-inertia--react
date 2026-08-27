import Pagination from '@/Components/tables/Pagination';
import { SalesTable } from '@/Components/tables/SalesTable';
import TableSearch from '@/Components/tables/TableSearch';
import { TableColumn } from '@/Components/tables/Table';
import { useT } from '@/lib/i18n';
import { Paginated, ShopSale } from '@/types';

const getColumns = (
    t: (key: string, replace?: Record<string, string | number>) => string,
): TableColumn[] => [
    {
        header: t('Reference'),
        accessor: 'reference',
        sortable: true,
    },
    {
        header: t('Cashier'),
        accessor: 'cashier',
    },
    {
        header: t('Date'),
        accessor: 'created_at',
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
        header: t('Actions'),
        accessor: 'actions',
    },
];

export default function Index({ sales }: { sales: Paginated<ShopSale> }) {
    const t = useT();

    return (
        <>
            <div className="space-y-6">
                {/* <div>
                    <h1 className="text-3xl font-bold">Sales</h1>
                </div> */}

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
                        <h2 className="hidden text-lg font-semibold md:block">
                            {t('All Tickets')}
                        </h2>
                        <TableSearch placeholder={t('Search by reference or cashier...')} />
                    </div>
                    <SalesTable sales={sales.data} columns={getColumns(t)} />
                    <Pagination
                        page={sales.current_page}
                        totalCount={sales.total}
                    />
                </div>
            </div>
        </>
    );
}
