import BarcodeInput from '@/Components/forms/BarcodeInput';
import { ProductNameCell, ProductThumb } from '@/Components/ProductThumb';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
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
import { CartLine, PosCustomer, PosProduct } from '@/types';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const selectClassName =
    'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

function localIsoDate(offsetDays = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatMoney(value: string | number): string {
    const amount = Number(value);

    return Number.isNaN(amount) ? '0.00' : amount.toFixed(2);
}

export default function Index({
    session,
    no_barcode_products = [],
    customers = [],
}: {
    session: { id: number; opened_at: string | null; opening_amount: string };
    no_barcode_products?: PosProduct[];
    customers?: PosCustomer[];
}) {
    const barcodeRef = useRef<HTMLInputElement>(null);
    const [barcode, setBarcode] = useState('');
    const [scanning, setScanning] = useState(false);

    const form = useForm({
        items: [] as CartLine[],
        amount_paid: '',
        payment_method: 'cash' as 'cash' | 'credit',
        customer_name: '',
        customer_phone: '',
        due_date: localIsoDate(1),
    });

    const isCredit = form.data.payment_method === 'credit';
    const total = form.data.items.reduce((sum, item) => {
        return sum + Number(item.quantity) * Number(item.unit_price);
    }, 0);
    const paid = Number(form.data.amount_paid) || 0;
    const change = paid - total;
    const remaining = Math.max(0, total - paid);
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

    const pay = async () => {
        if (form.processing || scanning || form.data.items.length === 0) {
            return;
        }

        setScanning(true);

        try {
            const nextItems: CartLine[] = [];

            for (const item of form.data.items) {
                const response = await window.axios.get<{ product: PosProduct }>(
                    route('pos.lookup-product'),
                    { params: { product_id: item.product_id } },
                );
                const product = response.data.product;
                const qty = Number(item.quantity);

                if (qty > Number(product.stock_quantity)) {
                    toast.error('Not enough stock for ' + product.name + '.');
                    form.setData(
                        'items',
                        form.data.items.map((line) =>
                            line.product_id === item.product_id
                                ? {
                                      ...line,
                                      unit_price:
                                          formatInputNumber(product.sale_price) ||
                                          '0',
                                      stock_quantity:
                                          formatInputNumber(
                                              product.stock_quantity,
                                          ) || '0',
                                  }
                                : line,
                        ),
                    );
                    setScanning(false);
                    return;
                }

                nextItems.push({
                    ...item,
                    name: product.name,
                    barcode: product.barcode,
                    unit_price: formatInputNumber(product.sale_price) || '0',
                    stock_quantity:
                        formatInputNumber(product.stock_quantity) || '0',
                    image_url: product.image_url,
                });
            }

            const oldTotal = form.data.items.reduce((sum, item) => {
                return sum + Number(item.quantity) * Number(item.unit_price);
            }, 0);
            const newTotal = nextItems.reduce((sum, item) => {
                return sum + Number(item.quantity) * Number(item.unit_price);
            }, 0);

            form.setData('items', nextItems);

            if (Math.abs(oldTotal - newTotal) >= 0.01) {
                toast.error('Prices changed. Check the total, then pay again.');
                setScanning(false);
                return;
            }

            form.transform((data) => ({ ...data, items: nextItems }));
            form.post(route('pos.store'), {
                preserveScroll: true,
                onFinish: () => {
                    form.transform((data) => data);
                    setScanning(false);
                },
                onError: (errors) => {
                    const message =
                        errors.cash_session ??
                        errors.items ??
                        errors.amount_paid ??
                        errors.customer_name ??
                        errors.customer_phone ??
                        errors.due_date;

                    if (typeof message === 'string' && message !== '') {
                        toast.error(message);
                    }
                },
            });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                toast.error('A product in the cart is no longer available.');
            } else {
                toast.error('Could not refresh product prices.');
            }
            setScanning(false);
        }
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
                            <Field orientation="horizontal">
                                <Checkbox
                                    id="payment_credit"
                                    checked={isCredit}
                                    onCheckedChange={(checked) => {
                                        const credit = checked === true;
                                        const paidNow = Number(
                                            form.data.amount_paid,
                                        );
                                        const nextPaid =
                                            credit &&
                                            form.data.amount_paid !== '' &&
                                            !Number.isNaN(paidNow) &&
                                            paidNow >= total
                                                ? ''
                                                : form.data.amount_paid;

                                        form.setData({
                                            ...form.data,
                                            payment_method: credit
                                                ? 'credit'
                                                : 'cash',
                                            amount_paid: nextPaid,
                                        });
                                    }}
                                />
                                <FieldLabel
                                    htmlFor="payment_credit"
                                    className="font-normal"
                                >
                                    Sell on credit (pay later)
                                </FieldLabel>
                            </Field>
                            {isCredit ? (
                                <p className="-mt-3 text-xs text-muted-foreground">
                                    Stock leaves now. They can pay nothing
                                    today, or a part, then the rest by the date
                                    they say.
                                </p>
                            ) : null}

                            {isCredit ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {customers.length > 0 ? (
                                        <Field className="md:col-span-2">
                                            <FieldLabel htmlFor="known_customer">
                                                Known customer
                                            </FieldLabel>
                                            <select
                                                id="known_customer"
                                                className={selectClassName}
                                                defaultValue=""
                                                onChange={(e) => {
                                                    const customer =
                                                        customers.find(
                                                            (row) =>
                                                                String(
                                                                    row.id,
                                                                ) ===
                                                                e.target.value,
                                                        );

                                                    form.setData({
                                                        ...form.data,
                                                        customer_name:
                                                            customer?.name ??
                                                            '',
                                                        customer_phone:
                                                            customer?.phone ??
                                                            '',
                                                    });
                                                }}
                                            >
                                                <option value="">
                                                    New customer
                                                </option>
                                                {customers.map((customer) => (
                                                    <option
                                                        key={customer.id}
                                                        value={customer.id}
                                                    >
                                                        {customer.name} ·{' '}
                                                        {customer.phone}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                    ) : null}
                                    <Field>
                                        <FieldLabel htmlFor="customer_name">
                                            Customer name
                                        </FieldLabel>
                                        <Input
                                            id="customer_name"
                                            value={form.data.customer_name}
                                            onChange={(e) =>
                                                form.setData(
                                                    'customer_name',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <FieldError>
                                            {form.errors.customer_name}
                                        </FieldError>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="customer_phone">
                                            Phone (WhatsApp)
                                        </FieldLabel>
                                        <Input
                                            id="customer_phone"
                                            value={form.data.customer_phone}
                                            onChange={(e) =>
                                                form.setData(
                                                    'customer_phone',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <FieldError>
                                            {form.errors.customer_phone}
                                        </FieldError>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="due_date">
                                            Pay by
                                        </FieldLabel>
                                        <Input
                                            id="due_date"
                                            type="date"
                                            min={localIsoDate()}
                                            value={form.data.due_date}
                                            onChange={(e) =>
                                                form.setData(
                                                    'due_date',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <FieldError>
                                            {form.errors.due_date}
                                        </FieldError>
                                    </Field>
                                </div>
                            ) : null}

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="text-sm font-medium">
                                    Total: {formatMoney(total)} MAD
                                </div>
                                <Field>
                                    <FieldLabel htmlFor="amount_paid">
                                        {isCredit
                                            ? 'Paid now (optional)'
                                            : 'Amount paid'}
                                    </FieldLabel>
                                    <Input
                                        id="amount_paid"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder={isCredit ? '0' : ''}
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
                                    {isCredit ? (
                                        <>
                                            Remaining:{' '}
                                            {formatMoney(remaining)} MAD
                                        </>
                                    ) : (
                                        <>
                                            Change:{' '}
                                            {change >= 0
                                                ? formatMoney(change)
                                                : '0.00'}{' '}
                                            MAD
                                        </>
                                    )}
                                </div>
                            </div>
                        </FieldGroup>
                        <div className="mt-4 flex justify-end">
                            <Button
                                type="button"
                                disabled={form.processing || scanning}
                                onClick={pay}
                            >
                                {isCredit ? 'Sell on credit' : 'Pay'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
