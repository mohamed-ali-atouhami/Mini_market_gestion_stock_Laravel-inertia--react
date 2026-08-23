import FormModal from '@/Components/forms/FormModal';
import Pagination from '@/Components/tables/Pagination';
import TableSearch from '@/Components/tables/TableSearch';
import { TableColumn } from '@/Components/tables/Table';
import { SuppliersTable } from '@/Components/tables/SuppliersTable';
import { Paginated, ShopSupplier } from '@/types';

const getColumns = (): TableColumn[] => [
    {
        header: 'Name',
        accessor: 'name',
        sortable: true,
    },
    {
        header: 'Phone',
        accessor: 'phone',
        className: 'hidden md:table-cell',
    },
    {
        header: 'Address',
        accessor: 'address',
        className: 'hidden md:table-cell',
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
    suppliers,
}: {
    suppliers: Paginated<ShopSupplier>;
}) {
    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Suppliers</h1>
                </div>

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
                        <h2 className="hidden text-lg font-semibold md:block">
                            All Suppliers
                        </h2>
                        <div className="flex w-full flex-col items-center gap-4 md:w-auto md:flex-row">
                            <TableSearch placeholder="Search by name or phone..." />
                            <FormModal table="suppliers" type="create" />
                        </div>
                    </div>
                    <SuppliersTable
                        suppliers={suppliers.data}
                        columns={getColumns()}
                    />
                    <Pagination
                        page={suppliers.current_page}
                        totalCount={suppliers.total}
                    />
                </div>
            </div>
        </>
    );
}
