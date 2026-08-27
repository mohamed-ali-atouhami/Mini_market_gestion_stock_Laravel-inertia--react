import { Button, ButtonLink } from '@/Components/ui/button';
import { useT } from '@/lib/i18n';
import { ShopSale } from '@/types';

function formatMoney(value: string | number): string {
    const amount = Number(value);

    return Number.isNaN(amount) ? '0.00' : amount.toFixed(2);
}

export default function Receipt({
    sale,
    shop,
}: {
    sale: ShopSale;
    shop: {
        name: string;
        phone: string | null;
        address: string | null;
        footer: string | null;
    };
}) {
    const t = useT();
    const items = sale.items ?? [];

    return (
        <>
            <div className="mx-auto max-w-md space-y-6 print:max-w-none">
                <div className="rounded-md bg-card p-6 text-center ring-1 ring-foreground/10 print:ring-0">
                    <h1 className="text-xl font-bold">{shop.name}</h1>
                    {shop.address ? (
                        <p className="text-sm text-muted-foreground">
                            {shop.address}
                        </p>
                    ) : null}
                    {shop.phone ? (
                        <p className="text-sm text-muted-foreground">
                            {shop.phone}
                        </p>
                    ) : null}
                    <p className="mt-4 font-medium">{sale.reference}</p>
                    <p className="text-sm text-muted-foreground">
                        {sale.sold_at} · {sale.cashier}
                    </p>

                    <div className="mt-4 space-y-1 text-start text-sm">
                        {items.map((item) => (
                            <div
                                key={item.product_id}
                                className="flex justify-between"
                            >
                                <span>
                                    {item.quantity} × {item.name}
                                </span>
                                <span>
                                    {formatMoney(
                                        Number(item.quantity) *
                                            Number(item.unit_price),
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 space-y-1 border-t pt-3 text-start text-sm">
                        <div className="flex justify-between font-medium">
                            <span>{t('Total')}</span>
                            <span>{formatMoney(sale.total)} MAD</span>
                        </div>
                        <div className="flex justify-between">
                            <span>
                                {sale.payment_method === 'credit'
                                    ? t('Paid so far')
                                    : t('Paid')}
                            </span>
                            <span>
                                {formatMoney(
                                    sale.payment_method === 'credit'
                                        ? (sale.paid_so_far ?? sale.amount_paid)
                                        : sale.amount_paid,
                                )}{' '}
                                MAD
                            </span>
                        </div>
                        {sale.payment_method === 'credit' ? (
                            <>
                                {Number(sale.remaining) > 0 ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span>{t('Remaining')}</span>
                                            <span>
                                                {formatMoney(
                                                    sale.remaining ?? 0,
                                                )}{' '}
                                                MAD
                                            </span>
                                        </div>
                                        {sale.due_date ? (
                                            <div className="flex justify-between">
                                                <span>{t('Pay by')}</span>
                                                <span>{sale.due_date}</span>
                                            </div>
                                        ) : null}
                                    </>
                                ) : (
                                    <div className="flex justify-between">
                                        <span>{t('Credit')}</span>
                                        <span>{t('Settled')}</span>
                                    </div>
                                )}
                                {sale.customer ? (
                                    <div className="flex justify-between">
                                        <span>{t('Customer')}</span>
                                        <span>{sale.customer}</span>
                                    </div>
                                ) : null}
                            </>
                        ) : (
                            <div className="flex justify-between">
                                <span>{t('Change')}</span>
                                <span>
                                    {formatMoney(sale.change_amount)} MAD
                                </span>
                            </div>
                        )}
                    </div>

                    {shop.footer ? (
                        <p className="mt-6 text-sm text-muted-foreground">
                            {shop.footer}
                        </p>
                    ) : null}
                </div>

                <div className="flex justify-center gap-2 print:hidden">
                    <ButtonLink variant="ghost" href={route('pos.index')}>
                        {t('New sale')}
                    </ButtonLink>
                    <Button type="button" onClick={() => window.print()}>
                        {t('Print')}
                    </Button>
                </div>
            </div>
        </>
    );
}
