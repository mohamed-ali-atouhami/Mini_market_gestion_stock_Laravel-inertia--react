import { ProductNameCell, ProductThumb } from '@/Components/ProductThumb';
import { ButtonLink } from '@/Components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/Components/ui/chart';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { cn, formatMoney } from '@/lib/utils';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Banknote, Package, Receipt } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Label, Pie, PieChart, XAxis } from 'recharts';

const weekConfig = {
    purchases: {
        label: 'Purchases',
        color: '#3b82f6',
    },
    sales: {
        label: 'Sales',
        color: '#22c55e',
    },
} satisfies ChartConfig;

const categoryColors = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#94a3b8'];

type WeekDay = {
    day: string;
    label: string;
    sales: number;
    purchases: number;
};

type CategoryStock = {
    id: number;
    name: string;
    quantity: string;
    percent: number;
};

type RecentPurchase = {
    id: number;
    reference: string;
    supplier: string | null;
    purchase_date: string | null;
    total: string;
};

type LowStockRow = {
    id: number;
    name: string;
    stock_quantity: string;
    min_stock: string;
    image_url: string | null;
};

type TopSellingRow = {
    id: number;
    name: string;
    quantity: string;
    total: string;
    image_url: string | null;
};

export default function Dashboard({
    today,
    stock_value,
    low_stock,
    top_selling,
    week,
    stock_by_category,
    recent_purchases,
}: {
    today: { sales_total: string; ticket_count: number };
    stock_value: string;
    low_stock: LowStockRow[];
    top_selling: TopSellingRow[];
    week: WeekDay[];
    stock_by_category: CategoryStock[];
    recent_purchases: RecentPurchase[];
}) {
    const { shop, auth } = usePage<PageProps>().props;
    const currency = shop?.currency ?? 'MAD';
    const isOwner = auth.user?.role === 'owner';

    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* <div>
                    <h1 className="text-2xl font-bold">Welcome back {auth.user?.name ?? 'User'}</h1>
                     <p className="mt-1 text-muted-foreground">
                        Today at {shop?.name ?? 'the shop'}.
                    </p>
                </div> */}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Today sales"
                        value={formatMoney(today.sales_total, currency)}
                        icon={Banknote}
                        iconClass="bg-orange-500/10 text-orange-600"
                    />
                    <StatCard
                        label="Tickets today"
                        value={String(today.ticket_count)}
                        icon={Receipt}
                        iconClass="bg-violet-500/10 text-violet-600"
                    />
                    <StatCard
                        label="Stock value"
                        value={formatMoney(stock_value, currency)}
                        icon={Package}
                        iconClass="bg-blue-500/10 text-blue-600"
                    />
                    <Card>
                        <CardHeader>
                            <CardTitle>Top selling today</CardTitle>
                            <CardDescription>
                                What left the shelf today
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {top_selling.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No sales yet today.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {top_selling.map((row, index) => (
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
                                                        Qty {row.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="shrink-0 text-sm font-medium">
                                                {formatMoney(
                                                    row.total,
                                                    currency,
                                                )}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-5">
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Purchases vs sales</CardTitle>
                            <CardDescription>Last 7 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={weekConfig}
                                className="aspect-auto h-[260px] w-full"
                            >
                                <AreaChart
                                    accessibilityLayer
                                    data={week}
                                    margin={{ left: 12, right: 12 }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        interval={0}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent indicator="dot" />
                                        }
                                    />
                                    <ChartLegend
                                        content={<ChartLegendContent />}
                                    />
                                    <Area
                                        dataKey="purchases"
                                        type="natural"
                                        fill="var(--color-purchases)"
                                        fillOpacity={0.25}
                                        stroke="var(--color-purchases)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        dataKey="sales"
                                        type="natural"
                                        fill="var(--color-sales)"
                                        fillOpacity={0.25}
                                        stroke="var(--color-sales)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <CategoryDonut
                        rows={stock_by_category}
                        className="lg:col-span-2"
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent purchases</CardTitle>
                            {isOwner ? (
                                <CardAction>
                                    <ButtonLink
                                        variant="ghost"
                                        href={route('purchases.index')}
                                    >
                                        View all
                                    </ButtonLink>
                                </CardAction>
                            ) : null}
                        </CardHeader>
                        <CardContent>
                            {recent_purchases.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No deliveries received yet.
                                </p>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Reference</TableHead>
                                                <TableHead>Supplier</TableHead>
                                                <TableHead>Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recent_purchases.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell className="font-medium">
                                                        {row.reference}
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.supplier ?? '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatMoney(
                                                            row.total,
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Low stock</CardTitle>
                            {isOwner ? (
                                <CardAction>
                                    <ButtonLink
                                        variant="ghost"
                                        href={route('stock.index', {
                                            stock: 'LOW',
                                        })}
                                    >
                                        View all
                                    </ButtonLink>
                                </CardAction>
                            ) : null}
                        </CardHeader>
                        <CardContent>
                            {low_stock.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Nothing to reorder right now.
                                </p>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead>Stock</TableHead>
                                                <TableHead>Min</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {low_stock.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell>
                                                        <ProductNameCell
                                                            src={row.image_url}
                                                            name={row.name}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-destructive">
                                                        {row.stock_quantity}
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.min_stock}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    iconClass,
}: {
    label: string;
    value: string;
    icon: typeof Banknote;
    iconClass: string;
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
                <CardTitle className="text-2xl font-semibold">{value}</CardTitle>
            </CardHeader>
        </Card>
    );
}

function CategoryDonut({
    rows,
    className,
}: {
    rows: CategoryStock[];
    className?: string;
}) {
    const total = rows.reduce((sum, row) => sum + Number(row.quantity), 0);
    const config: ChartConfig = {
        quantity: { label: 'Stock' },
    };
    const data = rows.map((row, index) => {
        const key = `cat${row.id}`;
        const color = categoryColors[index % categoryColors.length];
        config[key] = {
            label: row.name,
            color,
        };

        return {
            key,
            name: row.name,
            quantity: Number(row.quantity),
            percent: row.percent,
            color,
            fill: `var(--color-${key})`,
        };
    });

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Stock by category</CardTitle>
                <CardDescription>What is sitting on the shelf</CardDescription>
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No stock on the shelf yet.
                    </p>
                ) : (
                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                        <ChartContainer
                            config={config}
                            className="aspect-square h-[220px] w-[220px] shrink-0"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            hideLabel
                                            nameKey="key"
                                        />
                                    }
                                />
                                <Pie
                                    data={data}
                                    dataKey="quantity"
                                    nameKey="key"
                                    innerRadius={58}
                                    strokeWidth={4}
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (
                                                viewBox &&
                                                'cx' in viewBox &&
                                                'cy' in viewBox
                                            ) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-foreground text-2xl font-bold"
                                                        >
                                                            {total}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={
                                                                (viewBox.cy ??
                                                                    0) + 20
                                                            }
                                                            className="fill-muted-foreground text-xs"
                                                        >
                                                            units
                                                        </tspan>
                                                    </text>
                                                );
                                            }

                                            return null;
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                        <ul className="w-full space-y-2 text-sm">
                            {data.map((row) => (
                                <li
                                    key={row.key}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <span
                                            className="size-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: row.color,
                                            }}
                                        />
                                        <span className="truncate">
                                            {row.name}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-muted-foreground">
                                        {row.percent}% ({row.quantity})
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
