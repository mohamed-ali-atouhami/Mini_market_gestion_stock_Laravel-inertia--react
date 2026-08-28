import BarcodeInput from '@/Components/forms/BarcodeInput';
import { ProductThumb } from '@/Components/ProductThumb';
import { StockCornerBadge } from '@/Components/StockCornerBadge';
import PosLayout from '@/Layouts/PosLayout';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { useT } from '@/lib/i18n';
import { cn, formatInputNumber, formatMoney } from '@/lib/utils';
import {
    CartLine,
    CategoryOption,
    PosCustomer,
    PosProduct,
} from '@/types';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    Banknote,
    HandCoins,
    Minus,
    Plus,
    ScanLine,
    Search,
    Trash2,
} from 'lucide-react';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
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

function roundQty(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function qtyStep(unit: string | undefined): number {
    return unit === 'kg' ? 0.1 : 1;
}

function Index({
    products = [],
    categories = [],
    customers = [],
}: {
    session: { id: number; opened_at: string | null; opening_amount: string };
    products?: PosProduct[];
    categories?: CategoryOption[];
    customers?: PosCustomer[];
}) {
    const barcodeRef = useRef<HTMLInputElement>(null);
    const tabsScrollRef = useRef<HTMLDivElement>(null);
    const t = useT();
    const [barcode, setBarcode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all');
    const [creditOpen, setCreditOpen] = useState(false);

    useEffect(() => {
        const scroller = tabsScrollRef.current;
        const active = scroller?.querySelector<HTMLElement>(
            '[data-slot="tabs-trigger"][data-active]',
        );

        if (!scroller || !active) {
            return;
        }

        active.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest',
        });
    }, [tab]);

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
    const busy = form.processing || scanning;
    const qtyMissing = form.data.items.some(
        (item) => Number(item.quantity) < 0.001,
    );

    const visibleProducts = useMemo(() => {
        const query = search.trim().toLowerCase();

        return products
            .filter((product) => {
                if (tab === 'no-barcode') {
                    if (product.barcode) {
                        return false;
                    }
                } else if (tab !== 'all' && String(product.category_id) !== tab) {
                    return false;
                }

                if (query === '') {
                    return true;
                }

                return (
                    product.name.toLowerCase().includes(query) ||
                    (product.barcode ?? '').toLowerCase().includes(query)
                );
            })
            .slice()
            .sort((a, b) => {
                const aOut = Number(a.stock_quantity) <= 0;
                const bOut = Number(b.stock_quantity) <= 0;

                if (aOut !== bOut) {
                    return aOut ? 1 : -1;
                }

                return a.name.localeCompare(b.name);
            });
    }, [products, search, tab]);

    const addProduct = (product: PosProduct) => {
        const stock = Number(product.stock_quantity);
        const existing = form.data.items.find(
            (item) => item.product_id === product.id,
        );
        const step = qtyStep(product.unit);
        const firstQty =
            product.unit === 'kg' ? roundQty(Math.min(1, stock)) : 1;
        const nextQty = existing
            ? roundQty(Number(existing.quantity) + step)
            : firstQty;

        if (nextQty > stock || nextQty < 0.001) {
            toast.error(t('Not enough stock for :name.', { name: product.name }));
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
                quantity: String(nextQty),
                unit_price: formatInputNumber(product.sale_price) || '0',
                unit: product.unit,
                stock_quantity: formatInputNumber(product.stock_quantity) || '0',
                image_url: product.image_url,
            },
        ]);
    };

    const lookup = async (input: { barcode?: string; productId?: number }) => {
        if (scanning) {
            return;
        }

        const code = input.barcode?.trim() ?? '';
        const productId = input.productId;

        if (productId === undefined && code === '') {
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
                            : { barcode: code },
                },
            );
            addProduct(response.data.product);

            if (productId === undefined) {
                setBarcode('');
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                toast.error(t('Product not found.'));
            } else {
                toast.error(
                    t(
                        productId !== undefined
                            ? 'Could not load this product.'
                            : 'Could not look up this barcode.',
                    ),
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

        if (value !== '' && Number(value) > Number(line.stock_quantity)) {
            toast.error(t('Not enough stock for :name.', { name: line.name }));
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

    const bumpQty = (item: CartLine, direction: 1 | -1) => {
        const next = roundQty(Number(item.quantity) + direction * qtyStep(item.unit));

        if (next < 0.001) {
            return;
        }

        updateQty(item.product_id, String(next));
    };

    const removeLine = (productId: number) => {
        form.setData(
            'items',
            form.data.items.filter((line) => line.product_id !== productId),
        );
    };

    const pay = async (method: 'cash' | 'credit') => {
        if (busy || form.data.items.length === 0 || qtyMissing) {
            if (qtyMissing) {
                toast.error(t('Enter a quantity for every product.'));
            }
            return;
        }

        if (method === 'cash' && form.data.amount_paid.trim() === '') {
            toast.error(t('Enter the amount paid.'));
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
                    toast.error(t('Not enough stock for :name.', { name: product.name }));
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
                    unit: product.unit,
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
                toast.error(
                    t('Prices changed. Check the total, then pay again.'),
                );
                setScanning(false);
                return;
            }

            form.transform((data) => ({
                ...data,
                items: nextItems,
                payment_method: method,
                amount_paid: form.data.amount_paid,
            }));
            form.post(route('pos.store'), {
                preserveScroll: true,
                onFinish: () => {
                    form.transform((data) => data);
                    setScanning(false);
                },
                onSuccess: () => setCreditOpen(false),
                onError: (errors) => {
                    const message =
                        errors.cash_session ??
                        errors.items ??
                        errors.amount_paid ??
                        errors.customer_name ??
                        errors.customer_phone ??
                        errors.due_date;

                    if (typeof message === 'string' && message !== '') {
                        toast.error(t(message));
                    }
                },
            });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                toast.error(
                    t('A product in the cart is no longer available.'),
                );
            } else {
                toast.error(t('Could not refresh product prices.'));
            }
            setScanning(false);
        }
    };

    const openCredit = () => {
        if (form.data.items.length === 0 || busy || qtyMissing) {
            return;
        }

        const paidNow = Number(form.data.amount_paid);
        const nextPaid =
            form.data.amount_paid !== '' &&
            !Number.isNaN(paidNow) &&
            paidNow >= total
                ? ''
                : form.data.amount_paid;

        form.setData({
            ...form.data,
            payment_method: 'credit',
            amount_paid: nextPaid,
        });
        setCreditOpen(true);
    };

    return (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:h-full lg:grid-cols-[minmax(18rem,24rem)_1fr]">
            <Card className="min-h-0 gap-0 overflow-hidden py-0 lg:h-full">
                <CardHeader className="border-b py-4">
                    <CardTitle>{t('Ticket')}</CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-4">
                    <Field>
                        <FieldLabel htmlFor="scan_barcode" className="sr-only">
                            {t('Scan barcode')}
                        </FieldLabel>
                        <div className="relative">
                            <ScanLine className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <BarcodeInput
                                id="scan_barcode"
                                ref={barcodeRef}
                                autoFocus
                                className="ps-8"
                                value={barcode}
                                onChange={setBarcode}
                                onScan={(code) => {
                                    void lookup({ barcode: code });
                                }}
                                disabled={scanning}
                            />
                        </div>
                        <FieldError>
                            {form.errors.items ? t(form.errors.items) : null}
                        </FieldError>
                        <FieldError>
                            {cashSessionError ? t(cashSessionError) : null}
                        </FieldError>
                    </Field>

                    <div className="min-h-0 max-h-64 flex-1 space-y-2 overflow-y-auto lg:max-h-none">
                        {form.data.items.length === 0 ? (
                            <p className="px-1 py-8 text-center text-sm text-muted-foreground">
                                <span className="lg:hidden">
                                    {t('Scan a product, or tap one below.')}
                                </span>
                                <span className="hidden lg:inline">
                                    {t(
                                        'Scan a product, or tap one beside the ticket.',
                                    )}
                                </span>
                            </p>
                        ) : (
                            form.data.items.map((item) => (
                                <div
                                    key={item.product_id}
                                    className="flex flex-wrap items-center gap-2 rounded-xl border bg-background p-2"
                                >
                                    <ProductThumb
                                        src={item.image_url}
                                        name={item.name}
                                        className="size-11"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {Number(item.unit_price).toFixed(2)}{' '}
                                            MAD
                                            {item.unit === 'kg' ? t(' / kg') : ''}{' '}
                                            × {item.quantity}
                                        </p>
                                    </div>
                                    <div className="flex items-center rounded-full border">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            className="rounded-full"
                                            disabled={busy}
                                            onClick={() => bumpQty(item, -1)}
                                        >
                                            <Minus />
                                        </Button>
                                        <Input
                                            className="h-7 w-12 border-0 bg-transparent px-0 text-center shadow-none focus-visible:ring-0"
                                            type="number"
                                            min="0.001"
                                            step={qtyStep(item.unit)}
                                            value={item.quantity}
                                            onChange={(e) =>
                                                updateQty(
                                                    item.product_id,
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            className="rounded-full"
                                            disabled={busy}
                                            onClick={() => bumpQty(item, 1)}
                                        >
                                            <Plus />
                                        </Button>
                                    </div>
                                    <span className="ms-auto w-14 shrink-0 text-end text-sm font-medium tabular-nums sm:w-16">
                                        {(
                                            Number(item.quantity) *
                                            Number(item.unit_price)
                                        ).toFixed(2)}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-destructive hover:text-destructive"
                                        disabled={busy}
                                        aria-label={t('Remove :name', {
                                            name: item.name,
                                        })}
                                        onClick={() =>
                                            removeLine(item.product_id)
                                        }
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-3 py-4">
                    <div>
                        <p className="text-3xl font-semibold tracking-tight tabular-nums">
                            {formatMoney(total)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {isCredit ? (
                                <>
                                    {t('Remaining :amount', {
                                        amount: formatMoney(remaining),
                                    })}
                                </>
                            ) : paid > 0 ? (
                                <>
                                    {t('Paid :paid · Change :change', {
                                        paid: paid.toFixed(2),
                                        change:
                                            change >= 0
                                                ? change.toFixed(2)
                                                : '0.00',
                                    })}
                                </>
                            ) : (
                                t('Enter the amount paid.')
                            )}
                        </p>
                    </div>
                    <Field>
                        <FieldLabel htmlFor="amount_paid">
                            {t('Amount paid')}
                        </FieldLabel>
                        <Input
                            id="amount_paid"
                            type="number"
                            min="0"
                            step="0.01"
                            // placeholder={total > 0 ? total.toFixed(2) : '0.00'}
                            value={form.data.amount_paid}
                            onChange={(e) =>
                                form.setData('amount_paid', e.target.value)
                            }
                        />
                        <FieldError>
                            {form.errors.amount_paid
                                ? t(form.errors.amount_paid)
                                : null}
                        </FieldError>
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            size="lg"
                            className="h-12 text-sm sm:h-14 sm:text-base"
                            disabled={
                                busy ||
                                form.data.items.length === 0 ||
                                qtyMissing
                            }
                            onClick={() => {
                                form.setData('payment_method', 'cash');
                                void pay('cash');
                            }}
                        >
                            <Banknote />
                            {t('Pay cash')}
                        </Button>
                        <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            className="h-12 text-sm sm:h-14 sm:text-base"
                            disabled={
                                busy ||
                                form.data.items.length === 0 ||
                                qtyMissing
                            }
                            onClick={openCredit}
                        >
                            <HandCoins />
                            <span className="flex flex-col items-start leading-tight">
                                <span>{t('Credit')}</span>
                                <span className="hidden text-[10px] font-normal text-muted-foreground sm:inline">
                                    {t('Pay later · WhatsApp')}
                                </span>
                            </span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            <Card className="min-h-0 min-w-0 gap-0 overflow-hidden py-0 lg:h-full">
                <CardHeader className="min-w-0 gap-3 overflow-hidden border-b py-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="ps-8"
                            placeholder={t('Search product')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative min-w-0">
                        <div
                            ref={tabsScrollRef}
                            className="overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden"
                        >
                            <Tabs
                                value={tab}
                                onValueChange={(value) =>
                                    setTab(String(value))
                                }
                                className="w-max min-w-full"
                            >
                                <TabsList
                                    variant="default"
                                    className="h-9 w-max min-w-full justify-center"
                                >
                                    <TabsTrigger
                                        value="all"
                                        className="flex-none px-2"
                                    >
                                        {t('All')}
                                    </TabsTrigger>
                                    {categories.map((category) => (
                                        <TabsTrigger
                                            key={category.id}
                                            value={String(category.id)}
                                            className="flex-none px-2"
                                        >
                                            {category.name}
                                        </TabsTrigger>
                                    ))}
                                    <TabsTrigger
                                        value="no-barcode"
                                        className="flex-none px-2"
                                    >
                                        {t('No barcode')}
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 start-0 w-6 bg-linear-to-r from-card to-transparent rtl:bg-linear-to-l" />
                        <div className="pointer-events-none absolute inset-y-0 end-0 w-6 bg-linear-to-l from-card to-transparent rtl:bg-linear-to-r" />
                    </div>
                </CardHeader>
                <CardContent className="min-h-0 py-4 lg:flex-1 lg:overflow-y-auto">
                    {visibleProducts.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                            {t('No products in this list.')}
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                            {visibleProducts.map((product) => {
                                const outOfStock =
                                    Number(product.stock_quantity) <= 0;

                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        disabled={busy || outOfStock}
                                        onClick={() => {
                                            void lookup({
                                                productId: product.id,
                                            });
                                        }}
                                        className={cn(
                                            'relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-background text-start outline-none transition hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
                                        )}
                                    >
                                        <div className="relative">
                                            <ProductThumb
                                                src={product.image_url}
                                                name={product.name}
                                                className="h-20 w-full rounded-none object-cover sm:h-24"
                                            />
                                            {product.is_low_stock &&
                                            !outOfStock ? (
                                                <StockCornerBadge kind="low" />
                                            ) : outOfStock ? (
                                                <StockCornerBadge kind="out" />
                                            ) : null}
                                        </div>
                                        <span className="truncate px-3 pt-2 text-sm font-medium">
                                            {product.name}
                                        </span>
                                        <span className="px-3 pb-3 text-xs text-muted-foreground">
                                            {Number(product.sale_price).toFixed(
                                                2,
                                            )}{' '}
                                            MAD
                                            {product.unit === 'kg'
                                                ? t(' / kg')
                                                : ''}
                                            {outOfStock
                                                ? ' · ' + t('out of stock')
                                                : ''}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={creditOpen}
                onOpenChange={(open) => {
                    setCreditOpen(open);

                    if (!open) {
                        form.setData({
                            ...form.data,
                            payment_method: 'cash',
                            customer_name: '',
                            customer_phone: '',
                            due_date: localIsoDate(1),
                        });
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('Sell on credit')}</DialogTitle>
                        <DialogDescription>
                            {t(
                                'Stock leaves now. They can pay nothing today, or a part, then the rest by the date they say.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                        {customers.length > 0 ? (
                            <Field>
                                <FieldLabel htmlFor="known_customer">
                                    {t('Known customer')}
                                </FieldLabel>
                                <select
                                    key={creditOpen ? 'credit-open' : 'credit-closed'}
                                    id="known_customer"
                                    className={selectClassName}
                                    defaultValue=""
                                    onChange={(e) => {
                                        const customer = customers.find(
                                            (row) =>
                                                String(row.id) ===
                                                e.target.value,
                                        );

                                        form.setData({
                                            ...form.data,
                                            payment_method: 'credit',
                                            customer_name: customer?.name ?? '',
                                            customer_phone:
                                                customer?.phone ?? '',
                                        });
                                    }}
                                >
                                    <option value="">{t('New customer')}</option>
                                    {customers.map((customer) => (
                                        <option
                                            key={customer.id}
                                            value={customer.id}
                                        >
                                            {customer.name} · {customer.phone}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        ) : null}
                        <Field>
                            <FieldLabel htmlFor="customer_name">
                                {t('Customer name')}
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
                                {form.errors.customer_name
                                    ? t(form.errors.customer_name)
                                    : null}
                            </FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="customer_phone">
                                {t('Phone (WhatsApp)')}
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
                                {form.errors.customer_phone
                                    ? t(form.errors.customer_phone)
                                    : null}
                            </FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="due_date">{t('Pay by')}</FieldLabel>
                            <Input
                                id="due_date"
                                type="date"
                                min={localIsoDate()}
                                value={form.data.due_date}
                                onChange={(e) =>
                                    form.setData('due_date', e.target.value)
                                }
                            />
                            <FieldError>
                                {form.errors.due_date
                                    ? t(form.errors.due_date)
                                    : null}
                            </FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="credit_paid_now">
                                {t('Paid now (optional)')}
                            </FieldLabel>
                            <Input
                                id="credit_paid_now"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                value={form.data.amount_paid}
                                onChange={(e) =>
                                    form.setData('amount_paid', e.target.value)
                                }
                            />
                        </Field>
                    </FieldGroup>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCreditOpen(false)}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button
                            type="button"
                            disabled={busy}
                            onClick={() => void pay('credit')}
                        >
                            {t('Sell on credit')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

Index.layout = (page: ReactNode) => <PosLayout>{page}</PosLayout>;

export default Index;
