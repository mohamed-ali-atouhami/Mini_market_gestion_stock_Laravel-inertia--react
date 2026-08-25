import BarcodeInput from '@/Components/forms/BarcodeInput';
import { ProductNameCell, ProductThumb } from '@/Components/ProductThumb';
import { Button } from '@/Components/ui/button';
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
import { cn, formatInputNumber } from '@/lib/utils';
import { CartLine, PosProduct } from '@/types';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

function formatMoney(value: string | number): string {
    const amount = Number(value);

    return Number.isNaN(amount) ? '0.00' : amount.toFixed(2);
}

export default function Index({
    session,
    no_barcode_products = [],
}: {
    session: { id: number; opened_at: string | null; opening_amount: string };
    no_barcode_products?: PosProduct[];
}) {
    const barcodeRef = useRef<HTMLInputElement>(null);
    const [barcode, setBarcode] = useState('');
    const [scanning, setScanning] = useState(false);

    const form = useForm({
        items: [] as CartLine[],
        amount_paid: '',
    });

    const total = form.data.items.reduce((sum, item) => {
        return sum + Number(item.quantity) * Number(item.unit_price);
    }, 0);
    const paid = Number(form.data.amount_paid);
    const change = Number.isNaN(paid) ? 0 : paid - total;
    const cashSessionError = (
        form.errors as typeof form.errors & { cash_session?: string }
    ).cash_session;

    const addProduct = (product: PosProduct) => {
        const stock = Number(product.stock_quantity);
        const existing = form.data.items.find(
            (item) => item.product_id === product.id,
        );
        const nextQty = existing ? Number(existing.quantity) + 1 : 1;

        if (nextQty > stock) {
            toast.error('Not enough stock for ' + product.name + '.');
            return;
        }

        if (existing) {
            form.setData(
                'items',
                form.data.items.map((item) =>
                    item.product_id === product.id
                        ? { ...item, quantity: String(nextQty) }
                        : item,
                ),
            );
            return;
        }

        form.setData('items', [
            ...form.data.items,
            {
                product_id: product.id,
                name: product.name,
                barcode: product.barcode,
                quantity: '1',
                unit_price: formatInputNumber(product.sale_price) || '0',
                stock_quantity: formatInputNumber(product.stock_quantity) || '0',
                image_url: product.image_url,
            },
        ]);
    };

    const lookup = async (input: { barcode?: string; productId?: number }) => {
        if (scanning) {
            return;
        }

        const barcode = input.barcode?.trim() ?? '';
        const productId = input.productId;

        if (productId === undefined && barcode === '') {
            return;
        }

        setScanning(true);

        try {
            const response = await window.axios.get<{ product: PosProduct }>(
                route('pos.lookup-product'),
                {
                    params:
                        productId !== undefined
                            ? { product_id: productId }
                            : { barcode },
                },
            );
            addProduct(response.data.product);

            if (productId === undefined) {
                setBarcode('');
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                toast.error('Product not found.');
            } else {
                toast.error(
                    productId !== undefined
                        ? 'Could not load this product.'
                        : 'Could not look up this barcode.',
                );
            }
        } finally {
            setScanning(false);
            window.setTimeout(() => barcodeRef.current?.focus(), 50);
        }
    };

    const updateQty = (productId: number, value: string) => {
        const line = form.data.items.find((item) => item.product_id === productId);

        if (!line) {
            return;
        }

        if (Number(value) > Number(line.stock_quantity)) {
            toast.error('Not enough stock for ' + line.name + '.');
            return;
        }

        form.setData(
            'items',
            form.data.items.map((item) =>
                item.product_id === productId
                    ? { ...item, quantity: value }
                    : item,
            ),
        );
    };

    const pay = () => {
        form.post(route('pos.store'), {
            preserveScroll: true,
            onError: (errors) => {
                const message =
                    errors.cash_session ?? errors.items ?? errors.amount_paid;

                if (typeof message === 'string' && message !== '') {
                    toast.error(message);
                }
            },
        });
    };

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">POS</h1>
                    <p className="mt-1 text-muted-foreground">
                        Caisse open since {session.opened_at ?? 'now'}. Scan, or
                        tap a product with no barcode.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                        <Field>
                            <FieldLabel htmlFor="scan_barcode">
                                Scan barcode
                            </FieldLabel>
                            <BarcodeInput
                                id="scan_barcode"
                                ref={barcodeRef}
                                autoFocus
                                value={barcode}
                                onChange={setBarcode}
                                onScan={(code) => {
                                    void lookup({ barcode: code });
                                }}
                                disabled={scanning}
                            />
                            <p className="text-xs text-muted-foreground">
                                Same product scanned again adds +1.
                            </p>
                            <FieldError>{form.errors.items}</FieldError>
                            <FieldError>{cashSessionError}</FieldError>
                        </Field>

                        {no_barcode_products.length > 0 ? (
                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-medium">
                                    No barcode
                                </p>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                    {no_barcode_products.map((product) => {
                                        const outOfStock =
                                            Number(product.stock_quantity) <= 0;

                                        return (
                                            <button
                                                key={product.id}
                                                type="button"
                                                disabled={scanning}
                                                onClick={() => {
                                                    void lookup({
                                                        productId: product.id,
                                                    });
                                                }}
                                                className={cn(
                                                    'flex flex-col items-start gap-2 rounded-lg border bg-background p-3 text-left outline-none hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50',
                                                    outOfStock && 'opacity-60',
                                                )}
                                            >
                                                <ProductThumb
                                                    src={product.image_url}
                                                    name={product.name}
                                                    className="size-12"
                                                />
                                                <span className="w-full truncate text-sm font-medium">
                                                    {product.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatMoney(
                                                        product.sale_price,
                                                    )}{' '}
                                                    MAD
                                                    {product.unit === 'kg'
                                                        ? ' / kg'
                                                        : ''}
                                                    {outOfStock
                                                        ? ' · out of stock'
                                                        : ''}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-4 rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.data.items.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-20 text-center text-muted-foreground"
                                            >
                                                Scan a product, or tap one with
                                                no barcode.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        form.data.items.map((item) => (
                                            <TableRow key={item.product_id}>
                                                <TableCell>
                                                    <ProductNameCell
                                                        src={item.image_url}
                                                        name={item.name}
                                                        thumbClassName="size-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        className="w-20"
                                                        type="number"
                                                        min="0.001"
                                                        step="0.001"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateQty(
                                                                item.product_id,
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {formatMoney(item.unit_price)}
                                                </TableCell>
                                                <TableCell>
                                                    {formatMoney(
                                                        Number(item.quantity) *
                                                            Number(
                                                                item.unit_price,
                                                            ),
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() =>
                                                            form.setData(
                                                                'items',
                                                                form.data.items.filter(
                                                                    (line) =>
                                                                        line.product_id !==
                                                                        item.product_id,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                        <FieldGroup>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="text-sm font-medium">
                                    Total: {formatMoney(total)} MAD
                                </div>
                                <Field>
                                    <FieldLabel htmlFor="amount_paid">
                                        Amount paid
                                    </FieldLabel>
                                    <Input
                                        id="amount_paid"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.data.amount_paid}
                                        onChange={(e) =>
                                            form.setData(
                                                'amount_paid',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <FieldError>
                                        {form.errors.amount_paid}
                                    </FieldError>
                                </Field>
                                <div className="text-sm font-medium">
                                    Change:{' '}
                                    {change >= 0 ? formatMoney(change) : '0.00'}{' '}
                                    MAD
                                </div>
                            </div>
                        </FieldGroup>
                        <div className="mt-4 flex justify-end">
                            <Button
                                type="button"
                                disabled={form.processing}
                                onClick={pay}
                            >
                                Pay
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
