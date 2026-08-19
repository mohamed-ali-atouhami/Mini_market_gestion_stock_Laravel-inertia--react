import Table, { TableColumn } from '@/Components/tables/Table';
import { RowActions } from '@/Components/tables/RowActions';
import { Badge } from '@/Components/ui/badge';
import { TableCell, TableRow } from '@/Components/ui/table';
import { ShopSupplier } from '@/types';

export function SuppliersTable({
    suppliers,
    columns,
}: {
    suppliers: ShopSupplier[];
    columns: TableColumn[];
}) {
    const renderRow = (supplier: ShopSupplier) => {
        return (
            <TableRow key={supplier.id}>
                <TableCell>
                    <div className="font-medium">{supplier.name}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    {supplier.phone ?? '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    {supplier.address ?? '—'}
                </TableCell>
                <TableCell>
                    <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                        {supplier.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                </TableCell>
                <TableCell>
                    <RowActions table="suppliers" data={supplier} />
                </TableCell>
            </TableRow>
        );
    };

    return <Table columns={columns} renderRow={renderRow} data={suppliers} />;
}
