import { ProductNameCell } from '@/Components/ProductThumb';
import { Button } from '@/Components/ui/button';
import { Field, FieldLabel } from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { formatMoney } from '@/lib/utils';
import { PageProps, ShopCashSession, ShopStockMovement } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';

export default function Index({
    filters,
    summary,
    sales_by_day,
    purchases_by_supplier,
    sessions,
    movements,
}: {
    filters: { from: string; to: string };
    summary: {
        sales_total: string;
        ticket_count: number;
        profit: string;
        purchases_total: string;
    };
    sales_by_day: { day: string; tickets: number; total: string }[];
    purchases_by_supplier: {
        name: string;
        deliveries: number;
        total: string;
    }[];
    sessions: (Pick<
        ShopCashSession,
        | 'id'
        | 'status'
        | 'opened_at'
        | 'opening_amount'
        | 'expected_amount'
        | 'closing_amount'
        | 'difference'
    > & { cashier: string | null })[];
    movements: ShopStockMovement[];
}) {
    const { shop } = usePage<PageProps>().props;
    const currency = shop?.currency ?? 'MAD';
    const form = useForm({
        from: filters.from,
        to: filters.to,
    });

    return (
        <>
            <div className="space-y-6">
                <div>
                    {/* <h1 className="text-3xl font-bold">Reports</h1> */}
                    <p className="text-muted-foreground">
                        Here you can generate reports for the shop.
                    </p>
                </div>

                <form
                    className="flex flex-wrap items-end gap-3 rounded-md bg-card p-4 ring-1 ring-foreground/10"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.get(route('reports.index'), {
                            preserveState: true,
                        });
                    }}
                >
                    <Field>
                        <FieldLabel htmlFor="from">From</FieldLabel>
                        <Input
                            id="from"
                            type="date"
                            value={form.data.from}
                            onChange={(e) =>
                                form.setData('from', e.target.value)
                            }
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="to">To</FieldLabel>
                        <Input
                            id="to"
                            type="date"
                            value={form.data.to}
                            onChange={(e) => form.setData('to', e.target.value)}
                        />
                    </Field>
                    <Button type="submit" disabled={form.processing}>
                        Apply
                    </Button>
                </form>

                <div className="grid gap-4 md:grid-cols-4">
                    <SummaryCard
                        label="Sales"
                        value={formatMoney(summary.sales_total, currency)}
                    />
                    <SummaryCard
                        label="Tickets"
                        value={String(summary.ticket_count)}
                    />
                    <SummaryCard
                        label="Profit estimate"
                        value={formatMoney(summary.profit, currency)}
                    />
                    <SummaryCard
                        label="Purchases"
                        value={formatMoney(summary.purchases_total, currency)}
                    />
                </div>

                <ReportTable
                    title="Sales by day"
                    empty="No sales in this period."
                    headers={['Day', 'Tickets', 'Total']}
                    rows={sales_by_day.map((row) => [
                        row.day,
                        String(row.tickets),
                        formatMoney(row.total, currency),
                    ])}
                />

                <ReportTable
                    title="Purchases by supplier"
                    empty="No received deliveries in this period."
                    headers={['Supplier', 'Deliveries', 'Total']}
                    rows={purchases_by_supplier.map((row) => [
                        row.name,
                        String(row.deliveries),
                        formatMoney(row.total, currency),
                    ])}
                />

                <ReportTable
                    title="Cash sessions"
                    empty="No caisse sessions in this period."
                    headers={[
                        'Opened',
                        'Cashier',
                        'Status',
                        'Opening',
                        'Expected',
                        'Counted',
                        'Difference',
                    ]}
                    rows={sessions.map((row) => [
                        row.opened_at ?? '—',
                        row.cashier ?? '—',
                        row.status,
                        formatMoney(row.opening_amount, currency),
                        formatMoney(row.expected_amount, currency),
                        formatMoney(row.closing_amount, currency),
                        formatMoney(row.difference, currency),
                    ])}
                />

                <ReportTable
                    title="Stock movements"
                    empty="No movements in this period."
                    headers={[
                        'When',
                        'Product',
                        'Type',
                        'Qty',
                        'Reason',
                        'Who',
                    ]}
                    rows={movements.map((row) => [
                        row.created_at ?? '—',
                        <ProductNameCell
                            key={row.id}
                            src={row.image_url}
                            name={row.product ?? '—'}
                        />,
                        `${row.type} / ${row.direction}`,
                        row.quantity,
                        row.reason,
                        row.user ?? '—',
                    ])}
                />
            </div>
        </>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
    );
}

function ReportTable({
    title,
    empty,
    headers,
    rows,
}: {
    title: string;
    empty: string;
    headers: string[];
    rows: ReactNode[][];
}) {
    return (
        <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
            <h2 className="mb-4 text-lg font-semibold">{title}</h2>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {headers.map((header) => (
                                <TableHead key={header}>{header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={headers.length}
                                    className="h-20 text-center text-muted-foreground"
                                >
                                    {empty}
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row, index) => (
                                <TableRow key={title + index}>
                                    {row.map((cell, cellIndex) => (
                                        <TableCell key={cellIndex}>
                                            {cell}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
