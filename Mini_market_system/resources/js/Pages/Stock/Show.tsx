import { ProductThumb } from '@/Components/ProductThumb';
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
import { cn } from '@/lib/utils';
import { ShopStockMovement, ShopStockProduct } from '@/types';
import { useForm } from '@inertiajs/react';

const selectClassName =
    'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export default function Show({
    product,
    movements,
}: {
    product: ShopStockProduct;
    movements: ShopStockMovement[];
}) {
    const form = useForm({
        direction: 'out',
        quantity: '',
        reason: '',
    });

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <ProductThumb
                            src={product.image_url}
                            name={product.name}
                            className="size-14"
                        />
                        <div>
                            <h1 className="text-3xl font-bold">{product.name}</h1>
                        <p className="mt-1 text-muted-foreground">
                            {product.barcode ?? 'No barcode'} · Stock{' '}
                            <span
                                className={cn(
                                    product.is_low_stock &&
                                        'font-semibold text-destructive',
                                )}
                            >
                                {product.stock_quantity}
                            </span>{' '}
                            / min {product.min_stock}
                        </p>
                        </div>
                    </div>
                    <ButtonLink variant="ghost" href={route('stock.index')}>
                        Back
                    </ButtonLink>
                </div>

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    <h2 className="mb-4 text-lg font-semibold">Adjust stock</h2>
                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post(route('stock.adjust', product.id), {
                                preserveScroll: true,
                                onSuccess: () => form.reset('quantity', 'reason'),
                            });
                        }}
                    >
                        <FieldGroup>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Field>
                                    <FieldLabel htmlFor="direction">
                                        Direction
                                    </FieldLabel>
                                    <select
                                        id="direction"
                                        className={selectClassName}
                                        value={form.data.direction}
                                        onChange={(e) =>
                                            form.setData(
                                                'direction',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="out">
                                            Out (damage, loss, count down)
                                        </option>
                                        <option value="in">
                                            In (found extra, count up)
                                        </option>
                                    </select>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="quantity">
                                        Quantity
                                    </FieldLabel>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        value={form.data.quantity}
                                        onChange={(e) =>
                                            form.setData(
                                                'quantity',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <FieldError>
                                        {form.errors.quantity}
                                    </FieldError>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="reason">
                                        Reason
                                    </FieldLabel>
                                    <Input
                                        id="reason"
                                        value={form.data.reason}
                                        onChange={(e) =>
                                            form.setData(
                                                'reason',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Broke a bottle"
                                        required
                                    />
                                    <FieldError>{form.errors.reason}</FieldError>
                                </Field>
                            </div>
                        </FieldGroup>
                        <Button type="submit" disabled={form.processing}>
                            Save adjustment
                        </Button>
                    </form>
                </div>

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    <h2 className="mb-4 text-lg font-semibold">Movements</h2>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>When</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Before → after</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Who</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="h-20 text-center text-muted-foreground"
                                        >
                                            No movements yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    movements.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                {row.created_at ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                {row.type} / {row.direction}
                                            </TableCell>
                                            <TableCell>{row.quantity}</TableCell>
                                            <TableCell>
                                                {row.quantity_before} →{' '}
                                                {row.quantity_after}
                                            </TableCell>
                                            <TableCell>{row.reason}</TableCell>
                                            <TableCell>
                                                {row.user ?? '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </>
    );
}
