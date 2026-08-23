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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/utils';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';

export default function Dashboard({
    today,
    stock_value,
    low_stock,
    top_selling,
}: {
    today: { sales_total: string; ticket_count: number };
    stock_value: string;
    low_stock: {
        id: number;
        name: string;
        stock_quantity: string;
        min_stock: string;
    }[];
    top_selling: { name: string; quantity: string; total: string }[];
}) {
    const { shop, auth } = usePage<PageProps>().props;
    const currency = shop?.currency ?? 'MAD';
    const isOwner = auth.user?.role === 'owner';

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="mt-1 text-muted-foreground">
                        Today at {shop?.name ?? 'the shop'}.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardDescription>Today sales</CardDescription>
                            <CardTitle className="text-2xl font-semibold">
                                {formatMoney(today.sales_total, currency)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardDescription>Tickets today</CardDescription>
                            <CardTitle className="text-2xl font-semibold">
                                {today.ticket_count}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardDescription>Stock value</CardDescription>
                            <CardTitle className="text-2xl font-semibold">
                                {formatMoney(stock_value, currency)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
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
                                        Stock
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
                                                    <TableCell className="font-medium">
                                                        {row.name}
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Top selling today</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {top_selling.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No sales yet today.
                                </p>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead>Qty</TableHead>
                                                <TableHead>Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {top_selling.map((row) => (
                                                <TableRow key={row.name}>
                                                    <TableCell className="font-medium">
                                                        {row.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.quantity}
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
