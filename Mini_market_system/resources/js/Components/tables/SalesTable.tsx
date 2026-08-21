import Table, { TableColumn } from '@/Components/tables/Table';
import { ButtonLink } from '@/Components/ui/button';
import { TableCell, TableRow } from '@/Components/ui/table';
import { ShopSale } from '@/types';
import { Eye } from 'lucide-react';

function formatMoney(value: string): string {
    const amount = Number(value);

    return Number.isNaN(amount) ? value : amount.toFixed(2);
}

export function SalesTable({
    sales,
    columns,
}: {
    sales: ShopSale[];
    columns: TableColumn[];
}) {
    const renderRow = (sale: ShopSale) => {
        return (
            <TableRow key={sale.id}>
                <TableCell>
                    <div className="font-medium">{sale.reference}</div>
                </TableCell>
                <TableCell>{sale.cashier ?? '—'}</TableCell>
                <TableCell className="hidden md:table-cell">
                    {sale.sold_at ?? '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    {formatMoney(sale.total)} MAD
                </TableCell>
                <TableCell>
                    <ButtonLink
                        variant="ghost"
                        size="icon-sm"
                        href={route('sales.show', sale.id)}
                    >
                        <Eye className="h-4 w-4" />
                    </ButtonLink>
                </TableCell>
            </TableRow>
        );
    };

    return <Table columns={columns} renderRow={renderRow} data={sales} />;
}
