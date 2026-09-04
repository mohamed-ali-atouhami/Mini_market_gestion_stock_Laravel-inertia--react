import { ProductNameCell, ProductThumb } from '@/Components/ProductThumb';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/Components/ui/chart';
import { Input } from '@/Components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useT } from '@/lib/i18n';
import { cn, formatMoney } from '@/lib/utils';
import { PageProps, ShopCashSession, ShopStockMovement } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { Banknote, HandCoins, Package, Receipt } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

type TopProduct = {
    id: number;
    name: string;
    quantity: string;
    total: string;
    image_url: string | null;
};

type SalesDay = {
    day: string;
    weekday: string;
    date_label: string;
    tickets: number;
    total: number;
};

type CaisseToday = {
    cashier: string | null;
    status: string;
    opening: string;
    cash_sales: string;
    expected: string;
    counted: string | null;
    difference: string | null;
};

type SessionRow = Pick<
    ShopCashSession,
    | 'id'
    | 'status'
    | 'opened_at'
    | 'opening_amount'
    | 'expected_amount'
    | 'closing_amount'
    | 'difference'
> & { cashier: string | null };

function localIsoDate(offsetDays = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function monthStart(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}-01`;
}

function isNegative(value: string | null | undefined): boolean {
    if (value === null || value === undefined || value === '') {
        return false;
    }

    return Number(value) < 0;
}

export default function Index({
    filters,
    summary,
    sales_by_day,
    top_products,
    purchases_by_supplier,
    caisse_today,
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
    sales_by_day: SalesDay[];
    top_products: TopProduct[];
    purchases_by_supplier: {
        name: string;
        deliveries: number;
        total: string;
    }[];
    caisse_today: CaisseToday | null;
    sessions: SessionRow[];
    movements: ShopStockMovement[];
}) {
    const t = useT();
    const { shop } = usePage<PageProps>().props;
    const currency = shop?.currency ?? 'MAD';
    const form = useForm({
        from: filters.from,
        to: filters.to,
    });

    useEffect(() => {
        form.setData({ from: filters.from, to: filters.to });
    }, [filters.from, filters.to]);
    const today = localIsoDate();
    const weekFrom = localIsoDate(-6);
    const monthFrom = monthStart();
    const preset =
        filters.to === today && filters.from === today
            ? 'today'
            : filters.to === today && filters.from === weekFrom
              ? 'week'
              : filters.to === today && filters.from === monthFrom
                ? 'month'
                : null;
    const useWeekdayLabels = sales_by_day.length <= 7;
    const crowdedAxis = sales_by_day.length > 8;
    const chartData = sales_by_day.map((row) => ({
        ...row,
        label: useWeekdayLabels ? t(row.weekday) : row.date_label,
    }));
    const chartConfig = {
        total: {
            label: t('Sales'),
            color: '#22c55e',
        },
    } satisfies ChartConfig;

    const applyRange = (from: string, to: string) => {
        form.setData({ from, to });
        router.get(
            route('reports.index'),
            { from, to },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <div className="space-y-6">
            <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                <form
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
                    onSubmit={(e) => {
                        e.preventDefault();
                        applyRange(form.data.from, form.data.to);
                    }}
                >
                    <label className="grid gap-1.5 text-sm text-muted-foreground">
                        <span>{t('From')}</span>
                        <Input
                            id="from"
                            type="date"
                            className="w-full"
                            value={form.data.from}
                            onChange={(e) =>
                                form.setData('from', e.target.value)
                            }
                        />
                    </label>
                    <label className="grid gap-1.5 text-sm text-muted-foreground">
                        <span>{t('To')}</span>
                        <Input
                            id="to"
                            type="date"
                            className="w-full"
                            value={form.data.to}
                            onChange={(e) => form.setData('to', e.target.value)}
                        />
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                        <Button
                            type="button"
                            className="w-full"
                            variant={preset === 'today' ? 'default' : 'outline'}
                            onClick={() => applyRange(today, today)}
                        >
                            {t('Today')}
                        </Button>
                        <Button
                            type="button"
                            className="w-full"
                            variant={preset === 'week' ? 'default' : 'outline'}
                            onClick={() => applyRange(weekFrom, today)}
                        >
                            {t('Week')}
                        </Button>
                        <Button
                            type="button"
                            className="w-full"
                            variant={preset === 'month' ? 'default' : 'outline'}
                            onClick={() => applyRange(monthFrom, today)}
                        >
                            {t('Month')}
                        </Button>
                    </div>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={form.processing}
                    >
                        {t('Apply')}
                    </Button>
                </form>
            </div>

            <Tabs defaultValue="overview" className="gap-4">
                <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <TabsList className="h-9 w-max min-w-full justify-start">
                        <TabsTrigger value="overview" className="flex-none px-2">
                            {t('Overview')}
                        </TabsTrigger>
                        <TabsTrigger value="caisse" className="flex-none px-2">
                            {t('Caisse')}
                        </TabsTrigger>
                        <TabsTrigger value="sales" className="flex-none px-2">
                            {t('Sales')}
                        </TabsTrigger>
                        <TabsTrigger value="stock" className="flex-none px-2">
                            {t('Stock')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="products"
                            className="flex-none px-2"
                        >
                            {t('Products')}
                        </TabsTrigger>
                    </TabsList>
                </div>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                label={t('Sales')}
                                value={formatMoney(
                                    summary.sales_total,
                                    currency,
                                )}
                                icon={Banknote}
                                iconClass="bg-orange-500/10 text-orange-600"
                            />
                            <StatCard
                                label={t('Tickets')}
                                value={String(summary.ticket_count)}
                                icon={Receipt}
                                iconClass="bg-violet-500/10 text-violet-600"
                            />
                            <StatCard
                                label={t('Profit')}
                                value={formatMoney(summary.profit, currency)}
                                icon={HandCoins}
                                iconClass="bg-emerald-500/10 text-emerald-600"
                                negative={isNegative(summary.profit)}
                            />
                            <StatCard
                                label={t('Purchases')}
                                value={formatMoney(
                                    summary.purchases_total,
                                    currency,
                                )}
                                icon={Package}
                                iconClass="bg-blue-500/10 text-blue-600"
                            />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle>{t('Sales by day')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {sales_by_day.every(
                                        (row) => row.total === 0,
                                    ) ? (
                                        <p className="py-10 text-center text-sm text-muted-foreground">
                                            {t('No sales in this period.')}
                                        </p>
                                    ) : (
                                        <ChartContainer
                                            config={chartConfig}
                                            className="aspect-auto h-[260px] w-full"
                                        >
                                            <BarChart
                                                accessibilityLayer
                                                data={chartData}
                                                margin={{
                                                    left: 12,
                                                    right: 12,
                                                }}
                                            >
                                                <CartesianGrid
                                                    vertical={false}
                                                />
                                                <XAxis
                                                    dataKey="label"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={8}
                                                    interval={
                                                        crowdedAxis
                                                            ? 'preserveStartEnd'
                                                            : 0
                                                    }
                                                    minTickGap={
                                                        crowdedAxis ? 40 : 8
                                                    }
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    width={36}
                                                    tickMargin={4}
                                                />
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={
                                                        <ChartTooltipContent indicator="dot" />
                                                    }
                                                />
                                                <Bar
                                                    dataKey="total"
                                                    fill="var(--color-total)"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            </BarChart>
                                        </ChartContainer>
                                    )}
                                </CardContent>
                            </Card>

                            <CaisseTodayCard
                                row={caisse_today}
                                currency={currency}
                            />

                            <TopProductsCard
                                rows={top_products.slice(0, 5)}
                                currency={currency}
                            />

                            <CashSessionsCard
                                rows={sessions}
                                currency={currency}
                                compact
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="caisse" className="space-y-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                            <CaisseTodayCard
                                row={caisse_today}
                                currency={currency}
                            />
                            <CashSessionsCard
                                rows={sessions}
                                currency={currency}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="sales">
                        <ReportTable
                            title={t('Sales by day')}
                            empty={t('No sales in this period.')}
                            headers={[t('Day'), t('Tickets'), t('Total')]}
                            rows={sales_by_day
                                .filter((row) => row.tickets > 0)
                                .map((row) => [
                                    row.day,
                                    String(row.tickets),
                                    formatMoney(row.total, currency),
                                ])}
                        />
                    </TabsContent>

                    <TabsContent value="stock" className="space-y-4">
                        <ReportTable
                            title={t('Stock movements')}
                            empty={t('No movements in this period.')}
                            headers={[
                                t('When'),
                                t('Product'),
                                t('Type'),
                                t('Qty'),
                                t('Reason'),
                                t('Who'),
                            ]}
                            rows={movements.map((row) => [
                                row.created_at ?? '—',
                                <ProductNameCell
                                    key={row.id}
                                    src={row.image_url}
                                    name={row.product ?? '—'}
                                />,
                                `${t(row.type)} / ${t(row.direction)}`,
                                row.quantity,
                                t(row.reason),
                                row.user ?? '—',
                            ])}
                        />
                        <ReportTable
                            title={t('Purchases by supplier')}
                            empty={t('No received deliveries in this period.')}
                            headers={[
                                t('Supplier'),
                                t('Deliveries'),
                                t('Total'),
                            ]}
                            rows={purchases_by_supplier.map((row) => [
                                row.name,
                                String(row.deliveries),
                                formatMoney(row.total, currency),
                            ])}
                        />
                    </TabsContent>

                    <TabsContent value="products">
                        <TopProductsCard
                            rows={top_products}
                            currency={currency}
                        />
                    </TabsContent>
                </Tabs>
            </div>
    );
}

Index.layout = (page: ReactNode) => (
    <AuthenticatedLayout tillHeader>{page}</AuthenticatedLayout>
);

function StatCard({
    label,
    value,
    icon: Icon,
    iconClass,
    negative = false,
}: {
    label: string;
    value: string;
    icon: typeof Banknote;
    iconClass: string;
    negative?: boolean;
}) {
    return (
        <Card className="h-full">
            <CardHeader>
                <div
                    className={cn(
                        'mb-2 flex size-9 items-center justify-center rounded-lg',
                        iconClass,
                    )}
                >
                    <Icon className="size-4" />
                </div>
                <CardDescription>{label}</CardDescription>
                <CardTitle
                    className={cn(
                        'text-2xl font-semibold tabular-nums',
                        negative && 'text-destructive',
                    )}
                >
                    {value}
                </CardTitle>
            </CardHeader>
        </Card>
    );
}

function CaisseTodayCard({
    row,
    currency,
}: {
    row: CaisseToday | null;
    currency: string;
}) {
    const t = useT();
    const lines = row
        ? [
              { label: t('Opening'), value: row.opening },
              { label: t('Cash sales'), value: row.cash_sales },
              { label: t('Expected'), value: row.expected },
              { label: t('Counted'), value: row.counted },
              { label: t('Difference'), value: row.difference },
          ]
        : [];

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>{t('Caisse today')}</CardTitle>
                {row ? (
                    <CardDescription>
                        {row.cashier ?? '—'} ·{' '}
                        {t(row.status === 'closed' ? 'Closed' : 'Open')}
                    </CardDescription>
                ) : (
                    <CardDescription>
                        {t('Expected vs counted.')}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                {row === null ? (
                    <p className="text-sm text-muted-foreground">
                        {t('No caisse session today.')}
                    </p>
                ) : (
                    <>
                        <div className="overflow-hidden rounded-md border">
                            {lines.map((line, index) => (
                                <div
                                    key={line.label}
                                    className={cn(
                                        'flex items-center justify-between gap-3 px-3 py-2.5 text-sm',
                                        index > 0 && 'border-t',
                                    )}
                                >
                                    <span className="text-muted-foreground">
                                        {line.label}
                                    </span>
                                    <span
                                        className={cn(
                                            'font-medium tabular-nums',
                                            isNegative(line.value) &&
                                                'text-destructive',
                                        )}
                                    >
                                        {formatMoney(line.value, currency)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                            {t('Expected vs counted.')}
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function TopProductsCard({
    rows,
    currency,
}: {
    rows: TopProduct[];
    currency: string;
}) {
    const t = useT();

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>{t('Top products')}</CardTitle>
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {t('No sales in this period.')}
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {rows.map((row, index) => (
                            <li
                                key={row.id}
                                className="flex items-center justify-between gap-3"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                        {index + 1}
                                    </span>
                                    <ProductThumb
                                        src={row.image_url}
                                        name={row.name}
                                        className="size-8"
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">
                                            {row.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {t(':quantity sold', {
                                                quantity: row.quantity,
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <p className="shrink-0 text-sm font-medium">
                                    {formatMoney(row.total, currency)}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

function CashSessionsCard({
    rows,
    currency,
    compact = false,
}: {
    rows: SessionRow[];
    currency: string;
    compact?: boolean;
}) {
    const t = useT();

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>{t('Cash sessions')}</CardTitle>
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {t('No caisse sessions in this period.')}
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {compact ? null : (
                                        <TableHead>{t('Opened')}</TableHead>
                                    )}
                                    <TableHead>{t('User')}</TableHead>
                                    <TableHead>{t('Status')}</TableHead>
                                    <TableHead>{t('Opening')}</TableHead>
                                    <TableHead>{t('Expected')}</TableHead>
                                    <TableHead>{t('Counted')}</TableHead>
                                    <TableHead>{t('Diff')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {compact ? null : (
                                            <TableCell>
                                                {row.opened_at ?? '—'}
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            {row.cashier ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <SessionStatus
                                                status={row.status}
                                            />
                                        </TableCell>
                                        <TableCell className="tabular-nums">
                                            {formatMoney(
                                                row.opening_amount,
                                                currency,
                                            )}
                                        </TableCell>
                                        <TableCell className="tabular-nums">
                                            {formatMoney(
                                                row.expected_amount,
                                                currency,
                                            )}
                                        </TableCell>
                                        <TableCell className="tabular-nums">
                                            {formatMoney(
                                                row.closing_amount,
                                                currency,
                                            )}
                                        </TableCell>
                                        <TableCell
                                            className={cn(
                                                'tabular-nums',
                                                isNegative(row.difference) &&
                                                    'text-destructive',
                                            )}
                                        >
                                            {formatMoney(
                                                row.difference,
                                                currency,
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function SessionStatus({ status }: { status: string }) {
    const t = useT();

    if (status === 'open') {
        return (
            <Badge className="border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-400">
                {t('Open')}
            </Badge>
        );
    }

    return <Badge variant="secondary">{t('Closed')}</Badge>;
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
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto rounded-md border">
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
            </CardContent>
        </Card>
    );
}
