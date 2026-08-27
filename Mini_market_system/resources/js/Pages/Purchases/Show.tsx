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
import { useT } from '@/lib/i18n';
import { ShopPurchase } from '@/types';

function formatMoney(value: string | number): string {
    const amount = Number(value);

    return Number.isNaN(amount) ? '0.00' : amount.toFixed(2);
}

function formatQty(value: string): string {
    const amount = Number(value);

    return Number.isNaN(amount) ? value : amount.toString();
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

export default function Show({ purchase }: { purchase: ShopPurchase }) {
    const t = useT();
    const items = purchase.items ?? [];

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {purchase.reference}
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            {purchase.supplier ?? t('No supplier')} ·{' '}
                            {purchase.purchase_date ?? t('No date')}
                        </p>
                    </div>
                    <Badge variant={statusVariant(purchase.status)}>
                        {t(statusLabel(purchase.status))}
                    </Badge>
                </div>

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    <dl className="mb-4 grid gap-4 text-sm md:grid-cols-2">
                        <div>
                            <dt className="text-muted-foreground">{t('Invoice')}</dt>
                            <dd className="font-medium">
                                {purchase.invoice_number ?? '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">{t('Notes')}</dt>
                            <dd className="font-medium">
                                {purchase.notes ?? '—'}
                            </dd>
                        </div>
                    </dl>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('Product')}</TableHead>
                                    <TableHead className="hidden md:table-cell">
                                        {t('Barcode')}
                                    </TableHead>
                                    <TableHead>{t('Qty')}</TableHead>
                                    <TableHead>{t('Cost')}</TableHead>
                                    <TableHead>{t('Total')}</TableHead>
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
                                        <TableCell className="hidden md:table-cell">
                                            {item.barcode ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {formatQty(item.quantity)}
                                        </TableCell>
                                        <TableCell>
                                            {formatMoney(item.unit_cost)}
                                        </TableCell>
                                        <TableCell>
                                            {formatMoney(
                                                Number(item.quantity) *
                                                    Number(item.unit_cost),
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <ButtonLink
                            variant="ghost"
                            href={route('purchases.index')}
                        >
                            {t('Back')}
                        </ButtonLink>
                        <div className="text-sm font-medium">
                            {t('Total: :amount MAD', {
                                amount: formatMoney(purchase.total),
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
