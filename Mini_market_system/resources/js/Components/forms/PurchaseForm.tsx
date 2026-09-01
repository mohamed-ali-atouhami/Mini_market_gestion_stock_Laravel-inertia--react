import BarcodeInput from '@/Components/forms/BarcodeInput';
import FormModal from '@/Components/forms/FormModal';
import { ProductThumb } from '@/Components/ProductThumb';
import { StockCornerBadge } from '@/Components/StockCornerBadge';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import {
    Field,
    FieldError,
    FieldLabel,
} from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { useT } from '@/lib/i18n';
import { cn, formatInputNumber, formatMoney, isPieceQuantity } from '@/lib/utils';
import {
    CategoryOption,
    PurchaseLine,
    PurchaseProduct,
    ScannedProduct,
    ShopPurchase,
} from '@/types';
import { router, useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    Minus,
    PackageCheck,
    Plus,
    Save,
    ScanLine,
    Search,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const selectClassName =
    'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

type SupplierOption = {
    id: number;
    name: string;
};

function today(): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}

function roundQty(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function qtyStep(unit: string | undefined): number {
    return unit === 'kg' ? 0.1 : 1;
}

export default function PurchaseForm({
    suppliers,
    categories,
    products = [],
    purchase,
}: {
    suppliers: SupplierOption[];
    categories: CategoryOption[];
    products?: PurchaseProduct[];
    purchase?: ShopPurchase;
}) {
    const t = useT();
    const barcodeRef = useRef<HTMLInputElement>(null);
    const tabsScrollRef = useRef<HTMLDivElement>(null);
    const [barcode, setBarcode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all');
    const [unknownBarcode, setUnknownBarcode] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    const form = useForm({
        supplier_id: purchase?.supplier_id ?? suppliers[0]?.id ?? 0,
        purchase_date: purchase?.purchase_date ?? today(),
        invoice_number: purchase?.invoice_number ?? '',
        notes: purchase?.notes ?? '',
        items: (purchase?.items ?? []).map((item) => ({
            ...item,
            quantity: formatInputNumber(item.quantity),
            unit_cost: formatInputNumber(item.unit_cost),
        })),
        receive: false as boolean,
    });
    const extraErrors = form.errors as typeof form.errors & {
        status?: string;
    };
    const total = form.data.items.reduce((sum, item) => {
        return sum + Number(item.quantity) * Number(item.unit_cost);
    }, 0);
    const busy = form.processing || scanning;
    const empty = form.data.items.length === 0;
    const noSupplier = !form.data.supplier_id;
    const qtyMissing = form.data.items.some(
        (item) => Number(item.quantity) < 0.001,
    );

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

    const tillCategories = useMemo(() => {
        const used = new Set(products.map((product) => product.category_id));

        return categories.filter((category) => used.has(category.id));
    }, [categories, products]);

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
                const aOk =
                    Number(a.stock_quantity) > Number(a.min_stock);
                const bOk =
                    Number(b.stock_quantity) > Number(b.min_stock);

                if (aOk !== bOk) {
                    return aOk ? -1 : 1;
                }

                return a.name.localeCompare(b.name);
            });
    }, [products, search, tab]);

    const addProduct = (product: PurchaseProduct | ScannedProduct) => {
        const existing = form.data.items.find(
            (item) => item.product_id === product.id,
        );
        const step = qtyStep(product.unit);
        const nextQty = existing
            ? roundQty(Number(existing.quantity) + step)
            : step;

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
                unit_cost: formatInputNumber(product.cost_price) || '0',
                unit: product.unit,
                image_url: product.image_url ?? null,
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
            const response = await window.axios.get<{
                product: PurchaseProduct;
            }>(route('purchases.lookup-product'), {
                params:
                    productId !== undefined
                        ? { product_id: productId }
                        : { barcode: code },
            });
            addProduct(response.data.product);

            if (productId === undefined) {
                setBarcode('');
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                if (productId !== undefined) {
                    toast.error(t('Product not found.'));
                } else {
                    setUnknownBarcode(code);
                    setCreateOpen(true);
                    toast.message(t('Product not found. Create it now.'));
                }
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

    const updateLine = (
        productId: number,
        field: 'quantity' | 'unit_cost',
        value: string,
    ) => {
        if (
            field === 'quantity' &&
            value !== '' &&
            !isPieceQuantity(
                form.data.items.find((item) => item.product_id === productId)
                    ?.unit,
                Number(value),
            )
        ) {
            toast.error(t('This product is sold by the piece. Use a whole number.'));
            return;
        }

        form.setData(
            'items',
            form.data.items.map((item) =>
                item.product_id === productId
                    ? { ...item, [field]: value }
                    : item,
            ),
        );
    };

    const bumpQty = (item: PurchaseLine, direction: 1 | -1) => {
        const next = roundQty(
            Number(item.quantity) + direction * qtyStep(item.unit),
        );

        if (next < 0.001) {
            return;
        }

        updateLine(item.product_id, 'quantity', String(next));
    };

    const removeLine = (productId: number) => {
        form.setData(
            'items',
            form.data.items.filter((item) => item.product_id !== productId),
        );
    };

    const clearLines = () => {
        form.setData('items', []);
    };

    const submit = (receive: boolean) => {
        if (busy || empty || noSupplier || qtyMissing) {
            if (qtyMissing) {
                toast.error(t('Enter a quantity for every product.'));
            }
            return;
        }

        if (
            form.data.items.some(
                (item) => !isPieceQuantity(item.unit, Number(item.quantity)),
            )
        ) {
            toast.error(t('This product is sold by the piece. Use a whole number.'));
            return;
        }

        form.transform((data) => ({ ...data, receive }));

        const options = {
            preserveScroll: true,
            onFinish: () => form.transform((data) => data),
            onError: (errors: Record<string, string>) => {
                const extra = errors as typeof errors & { status?: string };
                const message =
                    extra.items ??
                    extra.supplier_id ??
                    extra.purchase_date ??
                    extra.status;

                if (typeof message === 'string' && message !== '') {
                    toast.error(t(message));
                }
            },
        };

        if (purchase) {
            form.patch(route('purchases.update', purchase.id), options);
            return;
        }

        form.post(route('purchases.store'), options);
    };

    return (
        <>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:h-full lg:grid-cols-[minmax(18rem,24rem)_1fr]">
                <Card className="min-h-0 gap-0 overflow-hidden py-0 lg:h-full">
                    <CardHeader className="border-b py-4">
                        <CardTitle>{t('Delivery')}</CardTitle>
                        <CardAction>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                disabled={busy || empty}
                                aria-label={t('Clear delivery')}
                                onClick={clearLines}
                            >
                                <Trash2 />
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-4">
                        <Field>
                            <FieldLabel htmlFor="supplier_id">
                                {t('Supplier')}
                            </FieldLabel>
                            <select
                                id="supplier_id"
                                className={selectClassName}
                                value={form.data.supplier_id}
                                onChange={(e) =>
                                    form.setData(
                                        'supplier_id',
                                        Number(e.target.value),
                                    )
                                }
                            >
                                {suppliers.length === 0 ? (
                                    <option value={0}>
                                        {t('Create a supplier first')}
                                    </option>
                                ) : (
                                    suppliers.map((supplier) => (
                                        <option
                                            key={supplier.id}
                                            value={supplier.id}
                                        >
                                            {supplier.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            <FieldError>
                                {form.errors.supplier_id
                                    ? t(form.errors.supplier_id)
                                    : null}
                            </FieldError>
                        </Field>
                        <div className="grid grid-cols-2 gap-2">
                            <Field>
                                <FieldLabel htmlFor="purchase_date" className="sr-only">
                                    {t('Date')}
                                </FieldLabel>
                                <Input
                                    id="purchase_date"
                                    type="date"
                                    value={form.data.purchase_date}
                                    onChange={(e) =>
                                        form.setData(
                                            'purchase_date',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel
                                    htmlFor="invoice_number"
                                    className="sr-only"
                                >
                                    {t('Invoice number')}
                                </FieldLabel>
                                <Input
                                    id="invoice_number"
                                    placeholder={t('Invoice number')}
                                    value={form.data.invoice_number}
                                    onChange={(e) =>
                                        form.setData(
                                            'invoice_number',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </div>
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
                                {extraErrors.items
                                    ? t(extraErrors.items)
                                    : extraErrors.status
                                      ? t(extraErrors.status)
                                      : null}
                            </FieldError>
                        </Field>

                        <div className="min-h-0 max-h-64 flex-1 space-y-2 overflow-y-auto lg:max-h-none">
                            {empty ? (
                                <p className="px-1 py-8 text-center text-sm text-muted-foreground">
                                    <span className="lg:hidden">
                                        {t('Scan a product, or tap one below.')}
                                    </span>
                                    <span className="hidden lg:inline">
                                        {t(
                                            'Scan a product, or tap one beside the delivery.',
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
                                            <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                                                <span className="shrink-0">
                                                    {t('Cost')}
                                                </span>
                                                <Input
                                                    className="h-6 w-16 shrink-0 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unit_cost}
                                                    onChange={(e) =>
                                                        updateLine(
                                                            item.product_id,
                                                            'unit_cost',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <span className="truncate">
                                                    MAD
                                                    {item.unit === 'kg'
                                                        ? t(' / kg')
                                                        : ''}
                                                </span>
                                            </div>
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
                                                    updateLine(
                                                        item.product_id,
                                                        'quantity',
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
                                                Number(item.unit_cost)
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
                                {t('Stock updates on receive')}
                            </p>
                        </div>
                        {purchase ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="self-start px-0 text-muted-foreground"
                                disabled={busy}
                                onClick={() =>
                                    router.post(
                                        route('purchases.cancel', purchase.id),
                                    )
                                }
                            >
                                {t('Cancel draft')}
                            </Button>
                        ) : null}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                size="lg"
                                variant="outline"
                                className="h-12 text-sm sm:h-14 sm:text-base"
                                disabled={busy || empty || noSupplier || qtyMissing}
                                onClick={() => submit(false)}
                            >
                                <Save />
                                {t('Save draft')}
                            </Button>
                            <Button
                                type="button"
                                size="lg"
                                className="h-12 text-sm sm:h-14 sm:text-base"
                                disabled={busy || empty || noSupplier || qtyMissing}
                                onClick={() => submit(true)}
                            >
                                <PackageCheck />
                                {t('Receive')}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>

                <Card className="min-h-0 min-w-0 gap-0 overflow-hidden py-0 lg:h-full">
                    <CardHeader className="min-w-0 gap-3 overflow-hidden border-b py-4">
                        <CardTitle className="text-base font-medium">
                            {t('Tap products to add to the delivery')}
                        </CardTitle>
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
                                        {tillCategories.map((category) => (
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
                                        disabled={busy}
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
                                            {outOfStock ? (
                                                <StockCornerBadge kind="out" />
                                            ) : product.is_low_stock ? (
                                                <StockCornerBadge kind="low" />
                                            ) : null}
                                        </div>
                                        <span className="truncate px-3 pt-2 text-sm font-medium">
                                            {product.name}
                                        </span>
                                        <span className="px-3 pb-3 text-xs text-muted-foreground">
                                            {Number(product.cost_price).toFixed(
                                                2,
                                            )}{' '}
                                            MAD
                                            {product.unit === 'kg'
                                                ? t(' / kg')
                                                : ''}
                                        </span>
                                    </button>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <FormModal
                table="products"
                type="create"
                relatedData={{
                    categories,
                    initialBarcode: unknownBarcode,
                    returnTo: 'purchases',
                    onProductCreated: (product) => {
                        addProduct(product);
                        setBarcode('');
                        setUnknownBarcode('');
                    },
                }}
                open={createOpen}
                onOpenChange={(open) => {
                    setCreateOpen(open);
                    if (!open) {
                        window.setTimeout(
                            () => barcodeRef.current?.focus(),
                            50,
                        );
                    }
                }}
            />
        </>
    );
}
