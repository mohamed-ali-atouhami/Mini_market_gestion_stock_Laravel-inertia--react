import FormModal from '@/Components/forms/FormModal';
import Pagination from '@/Components/tables/Pagination';
import TableSearch from '@/Components/tables/TableSearch';
import { TableColumn } from '@/Components/tables/Table';
import { UsersTable } from '@/Components/tables/UsersTable';
import { useT } from '@/lib/i18n';
import { Paginated, RoleOption, ShopUser } from '@/types';

const getColumns = (
    t: (key: string, replace?: Record<string, string | number>) => string,
): TableColumn[] => [
    {
        header: t('Name'),
        accessor: 'name',
        sortable: true,
    },
    {
        header: t('Username'),
        accessor: 'username',
        className: 'hidden md:table-cell',
        sortable: true,
    },
    {
        header: t('Role'),
        accessor: 'role',
        filter: {
            type: 'select',
            paramKey: 'role',
            defaultValue: 'ALL',
            options: [
                { value: 'ALL', label: t('All roles') },
                { value: 'owner', label: t('Owner') },
                { value: 'cashier', label: t('Cashier') },
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
    users,
    roles,
}: {
    users: Paginated<ShopUser>;
    roles: RoleOption[];
}) {
    const t = useT();

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">{t('User Management')}</h1>
                </div>

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
                        <h2 className="hidden text-lg font-semibold md:block">
                            {t('All Users')}
                        </h2>
                        <div className="flex w-full flex-col items-center gap-4 md:w-auto md:flex-row">
                            <TableSearch placeholder={t('Search by name or username...')} />
                            <FormModal
                                table="users"
                                type="create"
                                relatedData={{ roles }}
                            />
                        </div>
                    </div>
                    <UsersTable
                        users={users.data}
                        columns={getColumns(t)}
                        roles={roles}
                    />
                    <Pagination
                        page={users.current_page}
                        totalCount={users.total}
                    />
                </div>
            </div>
        </>
    );
}
