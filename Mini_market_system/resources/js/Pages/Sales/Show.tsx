import { ProductNameCell } from '@/Components/ProductThumb';
import { ButtonLink } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { ShopSale } from '@/types';

function formatMoney(value: string | number): string {
    const amount = Number(value);

    return Number.isNaN(amount) ? '0.00' : amount.toFixed(2);
}

export default function Show({ sale }: { sale: ShopSale }) {
    const items = sale.items ?? [];

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{sale.reference}</h1>
                        <p className="mt-1 text-muted-foreground">
                            {sale.cashier ?? 'Cashier'} · {sale.sold_at ?? '—'}
                        </p>
                    </div>
                    <Badge>Completed</Badge>
                </div>

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.product_id}>
                                        <TableCell>
                                            <ProductNameCell
                                                src={item.image_url}
                                                name={item.name}
                                            />
                                        </TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>
                                            {formatMoney(item.unit_price)}
                                        </TableCell>
                                        <TableCell>
                                            {formatMoney(
                                                Number(item.quantity) *
                                                    Number(item.unit_price),
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <dl className="mt-4 grid gap-2 text-sm md:grid-cols-3">
                        <div>
                            <dt className="text-muted-foreground">Total</dt>
                            <dd className="font-medium">
                                {formatMoney(sale.total)} MAD
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">
                                {sale.payment_method === 'credit'
                                    ? 'Paid so far'
                                    : 'Paid'}
                            </dt>
                            <dd className="font-medium">
                                {formatMoney(
                                    sale.payment_method === 'credit'
                                        ? (sale.paid_so_far ?? sale.amount_paid)
                                        : sale.amount_paid,
                                )}{' '}
                                MAD
                            </dd>
                        </div>
                        {sale.payment_method === 'credit' ? (
                            <>
                                <div>
                                    <dt className="text-muted-foreground">
                                        Remaining
                                    </dt>
                                    <dd className="font-medium">
                                        {Number(sale.remaining) > 0
                                            ? formatMoney(sale.remaining ?? 0) +
                                              ' MAD'
                                            : 'Settled'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        Customer
                                    </dt>
                                    <dd className="font-medium">
                                        {sale.customer ?? '—'}
                                    </dd>
                                </div>
                                {Number(sale.remaining) > 0 ? (
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Due
                                        </dt>
                                        <dd className="font-medium">
                                            {sale.due_date ?? '—'}
                                        </dd>
                                    </div>
                                ) : null}
                            </>
                        ) : (
                            <div>
                                <dt className="text-muted-foreground">
                                    Change
                                </dt>
                                <dd className="font-medium">
                                    {formatMoney(sale.change_amount)} MAD
                                </dd>
                            </div>
                        )}
                    </dl>

                    <div className="mt-4 flex justify-end gap-2">
                        <ButtonLink
                            variant="ghost"
                            href={route('sales.index')}
                        >
                            Back
                        </ButtonLink>
                        <ButtonLink href={route('sales.receipt', sale.id)}>
                            Receipt
                        </ButtonLink>
                    </div>
                </div>
            </div>
        </>
    );
}
