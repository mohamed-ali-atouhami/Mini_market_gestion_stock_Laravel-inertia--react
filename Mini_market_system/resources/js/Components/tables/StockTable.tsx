import { ProductNameCell } from '@/Components/ProductThumb';
import Table, { TableColumn } from '@/Components/tables/Table';
import { ButtonLink } from '@/Components/ui/button';
import { TableCell, TableRow } from '@/Components/ui/table';
import { ShopStockProduct } from '@/types';
import { cn } from '@/lib/utils';
import {HistoryIcon} from 'lucide-react';

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
                    <ProductNameCell
                        src={product.image_url}
                        name={product.name}
                    />
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
                        variant="outline"
                        href={route('stock.show', product.id)}
                        className="text-xs font-normal hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
                    >
                        <HistoryIcon size={10} />
                        <span className="ml-2 text-xs">History</span>
                    </ButtonLink>
                </TableCell>
            </TableRow>
        );
    };

    return <Table columns={columns} renderRow={renderRow} data={products} />;
}
