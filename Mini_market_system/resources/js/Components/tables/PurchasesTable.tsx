import Table, { TableColumn } from '@/Components/tables/Table';
import { Badge } from '@/Components/ui/badge';
import { ButtonLink } from '@/Components/ui/button';
import { TableCell, TableRow } from '@/Components/ui/table';
import { ShopPurchase } from '@/types';
import { Eye, Pencil } from 'lucide-react';

function formatMoney(value: string): string {
    const amount = Number(value);

    return Number.isNaN(amount) ? value : amount.toFixed(2);
}

function statusVariant(
    status: ShopPurchase['status'],
): 'default' | 'secondary' | 'outline' {
    if (status === 'received') {
        return 'default';
    }

    if (status === 'cancelled') {
        return 'secondary';
    }

    return 'outline';
}

function statusLabel(status: ShopPurchase['status']): string {
    if (status === 'received') {
        return 'Received';
    }

    if (status === 'cancelled') {
        return 'Cancelled';
    }

    return 'Draft';
}

export function PurchasesTable({
    purchases,
    columns,
}: {
    purchases: ShopPurchase[];
    columns: TableColumn[];
}) {
    const renderRow = (purchase: ShopPurchase) => {
        const href =
            purchase.status === 'draft'
                ? route('purchases.edit', purchase.id)
                : route('purchases.show', purchase.id);

        return (
            <TableRow key={purchase.id}>
                <TableCell>
                    <div className="font-medium">{purchase.reference}</div>
                </TableCell>
                <TableCell>{purchase.supplier ?? '—'}</TableCell>
                <TableCell className="hidden md:table-cell">
                    {purchase.purchase_date ?? '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    {formatMoney(purchase.total)} MAD
                </TableCell>
                <TableCell>
                    <Badge variant={statusVariant(purchase.status)}>
                        {statusLabel(purchase.status)}
                    </Badge>
                </TableCell>
                <TableCell>
                    <ButtonLink
                        variant="ghost"
                        size="icon-sm"
                        href={href}
                    >
                        {purchase.status === 'draft' ? (
                            <Pencil className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </ButtonLink>
                </TableCell>
            </TableRow>
        );
    };

    return <Table columns={columns} renderRow={renderRow} data={purchases} />;
}
