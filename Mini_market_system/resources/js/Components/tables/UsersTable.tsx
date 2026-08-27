import Table, { TableColumn } from '@/Components/tables/Table';
import { UserActions } from '@/Components/tables/UserActions';
import { Badge } from '@/Components/ui/badge';
import { TableCell, TableRow } from '@/Components/ui/table';
import { useT } from '@/lib/i18n';
import { RoleOption, ShopUser } from '@/types';

export function UsersTable({
    users,
    columns,
    roles,
}: {
    users: ShopUser[];
    columns: TableColumn[];
    roles: RoleOption[];
}) {
    const t = useT();
    const renderRow = (user: ShopUser) => {
        return (
            <TableRow key={user.id}>
                <TableCell>
                    <div className="font-medium">{user.name}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    {user.username}
                </TableCell>
                <TableCell>
                    <Badge variant="outline">
                        {user.role ? t(user.role) : '—'}
                    </Badge>
                </TableCell>
                <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'} >
                        {user.is_active ? t('Active') : t('Disabled')}
                    </Badge>
                </TableCell>
                <TableCell>
                    <UserActions user={user} roles={roles} />
                </TableCell>
            </TableRow>
        );
    };

    return (
        <Table columns={columns} renderRow={renderRow} data={users} />
    );
}
