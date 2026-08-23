import Table, { TableColumn } from '@/Components/tables/Table';
import { ButtonLink } from '@/Components/ui/button';
import { TableCell, TableRow } from '@/Components/ui/table';
import { ShopStockProduct } from '@/types';
import { cn } from '@/lib/utils';

function formatQty(value: string): string {
    const amount = Number(value);

    return Number.isNaN(amount) ? value : amount.toString();
}

export function StockTable({
    products,
    columns,
}: {
    products: ShopStockProduct[];
    columns: TableColumn[];
}) {
    const renderRow = (product: ShopStockProduct) => {
        return (
            <TableRow
                key={product.id}
                className={cn(product.is_low_stock && 'bg-destructive/10')}
            >
                <TableCell>
                    <div className="font-medium">{product.name}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    {product.barcode ?? '—'}
                </TableCell>
                <TableCell>
                    <span
                        className={cn(
                            product.is_low_stock &&
                                'font-semibold text-destructive',
                        )}
                    >
                        {formatQty(product.stock_quantity)}
                    </span>
                </TableCell>
                <TableCell>{formatQty(product.min_stock)}</TableCell>
                <TableCell>
                    <ButtonLink
                        variant="ghost"
                        href={route('stock.show', product.id)}
                    >
                        History
                    </ButtonLink>
                </TableCell>
            </TableRow>
        );
    };

    return <Table columns={columns} renderRow={renderRow} data={products} />;
}
