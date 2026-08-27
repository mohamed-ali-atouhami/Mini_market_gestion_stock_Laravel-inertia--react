import { Badge } from '@/Components/ui/badge';
import { Button, ButtonLink } from '@/Components/ui/button';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { useT } from '@/lib/i18n';
import { ShopCashSession } from '@/types';
import { useForm } from '@inertiajs/react';

function formatMoney(value: string | number | null): string {
    if (value === null) {
        return '—';
    }

    const amount = Number(value);

    return Number.isNaN(amount) ? String(value) : amount.toFixed(2);
}

export default function Index({
    session,
    history,
}: {
    session: (ShopCashSession & { sales_total: string }) | null;
    history: ShopCashSession[];
}) {
    const t = useT();
    const openForm = useForm({
        opening_amount: '0',
    });
    const closeForm = useForm({
        closing_amount: '',
    });

    return (
        <>
            <div className="space-y-6">
                <div>
                    {/* <h1 className="text-3xl font-bold">Caisse</h1> */}
                    <p className="mt-1 text-muted-foreground">
                        {t('Open before selling. Close at the end of the day.')}
                    </p>
                </div>

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    {session ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge>{t('Open')}</Badge>
                                <span className="text-sm text-muted-foreground">
                                    {t('since :time', {
                                        time: session.opened_at ?? '—',
                                    })}
                                </span>
                            </div>
                            <dl className="grid gap-3 text-sm md:grid-cols-3">
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('Opening')}
                                    </dt>
                                    <dd className="font-medium">
                                        {formatMoney(session.opening_amount)} MAD
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('Cash taken')}
                                    </dt>
                                    <dd className="font-medium">
                                        {formatMoney(session.sales_total)} MAD
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('Expected in drawer')}
                                    </dt>
                                    <dd className="font-medium">
                                        {formatMoney(session.expected_amount)} MAD
                                    </dd>
                                </div>
                            </dl>
                            <form
                                className="flex flex-wrap items-end gap-3"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    closeForm.post(
                                        route('caisse.close', session.id),
                                    );
                                }}
                            >
                                <Field>
                                    <FieldLabel htmlFor="closing_amount">
                                        {t('Counted cash')}
                                    </FieldLabel>
                                    <Input
                                        id="closing_amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={closeForm.data.closing_amount}
                                        onChange={(e) =>
                                            closeForm.setData(
                                                'closing_amount',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t('Type what you counted in the drawer.')}
                                    </p>
                                    <FieldError>
                                        {closeForm.errors.closing_amount}
                                    </FieldError>
                                </Field>
                                <Button
                                    type="submit"
                                    disabled={closeForm.processing}
                                >
                                    {t('Close caisse')}
                                </Button>
                                <ButtonLink
                                    variant="outline"
                                    href={route('pos.index')}
                                >
                                    {t('Go to POS')}
                                </ButtonLink>
                            </form>
                        </div>
                    ) : (
                        <form
                            className="space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                openForm.post(route('caisse.open'));
                            }}
                        >
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="opening_amount">
                                        {t('Opening amount')}
                                    </FieldLabel>
                                    <Input
                                        id="opening_amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={openForm.data.opening_amount}
                                        onChange={(e) =>
                                            openForm.setData(
                                                'opening_amount',
                                                e.target.value,
                                            )
                                        }
                                        required
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t('Cash already in the drawer.')}
                                    </p>
                                    <FieldError>
                                        {openForm.errors.opening_amount}
                                    </FieldError>
                                </Field>
                            </FieldGroup>
                            <Button
                                type="submit"
                                disabled={openForm.processing}
                            >
                                {t('Open caisse')}
                            </Button>
                        </form>
                    )}
                </div>

                {history.length > 0 ? (
                    <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                        <h2 className="mb-4 text-lg font-semibold">
                            {t('Recent sessions')}
                        </h2>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('Opened')}</TableHead>
                                        <TableHead>{t('Status')}</TableHead>
                                        <TableHead>{t('Opening')}</TableHead>
                                        <TableHead>{t('Counted')}</TableHead>
                                        <TableHead>{t('Difference')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                {row.opened_at ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        row.status === 'open'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {row.status === 'open'
                                                        ? t('Open')
                                                        : t('Closed')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {formatMoney(row.opening_amount)}
                                            </TableCell>
                                            <TableCell>
                                                {formatMoney(row.closing_amount)}
                                            </TableCell>
                                            <TableCell>
                                                {formatMoney(row.difference)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : null}
            </div>
        </>
    );
}
