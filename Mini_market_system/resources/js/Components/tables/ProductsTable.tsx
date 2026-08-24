import { ProductNameCell } from '@/Components/ProductThumb';
import Table, { TableColumn } from '@/Components/tables/Table';
import { RowActions } from '@/Components/tables/RowActions';
import { Badge } from '@/Components/ui/badge';
import { TableCell, TableRow } from '@/Components/ui/table';
import { CategoryOption, ShopProduct } from '@/types';
import { cn } from '@/lib/utils';

function formatQty(value: string): string {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return value;
    }

    return amount.toString();
}

function formatMoney(value: string): string {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return value;
    }

    return amount.toFixed(2);
}

export function ProductsTable({
    products,
    columns,
    categories,
}: {
    products: ShopProduct[];
    columns: TableColumn[];
    categories: CategoryOption[];
}) {
    const renderRow = (product: ShopProduct) => {
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
                    <Badge variant="outline">{product.category ?? '—'}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    {formatMoney(product.sale_price)}
                </TableCell>
                <TableCell>
                    <span
                        className={cn(
                            product.is_low_stock && 'font-semibold text-destructive',
                        )}
                    >
                        {formatQty(product.stock_quantity)}
                    </span>
                </TableCell>
                <TableCell>
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                </TableCell>
                <TableCell>
                    <RowActions
                        table="products"
                        data={product}
                        relatedData={{ categories }}
                    />
                </TableCell>
            </TableRow>
        );
    };

    return <Table columns={columns} renderRow={renderRow} data={products} />;
}
