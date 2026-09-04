import BarcodeInput from '@/Components/forms/BarcodeInput';
import { ProductThumb } from '@/Components/ProductThumb';
import { StockCornerBadge } from '@/Components/StockCornerBadge';
import { Button } from '@/Components/ui/button';
import {
    Card,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { useT } from '@/lib/i18n';
import { cn, formatMoney, isPieceQuantity } from '@/lib/utils';
import {
    CategoryOption,
    PosProduct,
    ShopWaitingReturn,
} from '@/types';
import { router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ScanLine, Search, Trash2, Undo2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const selectClassName =
    'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

type ReturnProduct = PosProduct & {
    last_supplier_id?: number | null;
};

type Picking =
    | { kind: 'returned' }
    | { kind: 'replacement'; key: string };

type DraftLine = {
    key: string;
    product: ReturnProduct;
    returned_quantity: string;
    condition: 'sellable' | 'defective';
    action: 'refund' | 'replace';
    replacement: ReturnProduct | null;
    replacement_quantity: string;
    supplier_id: string | number;
};

function roundQty(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function qtyStep(unit: string | undefined): number {
    return unit === 'kg' ? 0.1 : 1;
}

function money(value: number): number {
    return Math.round(value * 100) / 100;
}

function nextKey(): string {
    return `r-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Index({
    products = [],
    categories = [],
    suppliers = [],
    waiting = [],
}: {
    session: { id: number; opened_at: string | null; opening_amount: string };
    products?: ReturnProduct[];
    categories?: CategoryOption[];
    suppliers?: { id: number; name: string }[];
    waiting?: ShopWaitingReturn[];
}) {
    const barcodeRef = useRef<HTMLInputElement>(null);
    const t = useT();
    const [barcode, setBarcode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all');
    const [picking, setPicking] = useState<Picking>({ kind: 'returned' });
    const [lines, setLines] = useState<DraftLine[]>([]);
    const [givingId, setGivingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const pickingRef = useRef(picking);
    const linesRef = useRef(lines);
    pickingRef.current = picking;
    linesRef.current = lines;

    const form = useForm({
        amount_paid: '',
        reason: '',
    });

    const returnedValue = money(
        lines.reduce(
            (sum, line) =>
                sum +
                (Number(line.returned_quantity) || 0) *
                    Number(line.product.sale_price),
            0,
        ),
    );
    const replacementValue = money(
        lines.reduce((sum, line) => {
            if (line.action !== 'replace' || !line.replacement) {
                return sum;
            }

            return (
                sum +
                (Number(line.replacement_quantity) || 0) *
                    Number(line.replacement.sale_price)
            );
        }, 0),
    );
    const cashDelta = money(replacementValue - returnedValue);
    const paid = Number(form.data.amount_paid) || 0;
    const change = cashDelta > 0 ? money(paid - cashDelta) : 0;
    const shortfall = cashDelta > 0 ? money(Math.max(0, cashDelta - paid)) : 0;
    const extraErrors = form.errors as typeof form.errors & {
        items?: string;
        cash_session?: string;
    };
    const cashSessionError = extraErrors.cash_session;
    const busy = form.processing || scanning || submitting;
    const pickingReplacement =
        picking.kind === 'replacement'
            ? (lines.find((line) => line.key === picking.key) ?? null)
            : null;

    const visibleProducts = useMemo(() => {
        const query = search.trim().toLowerCase();

        return products.filter((product) => {
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
        });
    }, [products, search, tab]);

    const sellableReturnedIds = new Set(
        lines
            .filter((line) => line.condition === 'sellable')
            .map((line) => line.product.id),
    );

    const addReturned = (product: ReturnProduct) => {
        setLines((current) => {
            const existing = current.find(
                (line) =>
                    line.product.id === product.id &&
                    line.action === 'refund' &&
                    line.condition === 'sellable',
            );

            if (existing) {
                const step = qtyStep(product.unit);

                return current.map((line) =>
                    line.key === existing.key
                        ? {
                              ...line,
                              returned_quantity: String(
                                  roundQty(Number(line.returned_quantity) + step),
                              ),
                          }
                        : line,
                );
            }

            return [
                ...current,
                {
                    key: nextKey(),
                    product,
                    returned_quantity: product.unit === 'kg' ? '0.1' : '1',
                    condition: 'sellable',
                    action: 'refund',
                    replacement: null,
                    replacement_quantity: '1',
                    supplier_id: product.last_supplier_id ?? '',
                },
            ];
        });
        setPicking({ kind: 'returned' });
    };

    const assignReplacement = (product: ReturnProduct, lineKey: string) => {
        const current = linesRef.current;
        const line = current.find((row) => row.key === lineKey);

        if (!line || line.action !== 'replace') {
            return;
        }

        const stock = Number(product.stock_quantity);
        const sameSellable =
            line.product.id === product.id && line.condition === 'sellable';
        const coveredByReturn = current.some(
            (row) =>
                row.condition === 'sellable' && row.product.id === product.id,
        );

        if (stock <= 0 && !sameSellable && !coveredByReturn) {
            toast.error(t('Not enough stock for :name.', { name: product.name }));
            return;
        }

        setLines((rows) =>
            rows.map((row) =>
                row.key === lineKey
                    ? {
                          ...row,
                          action: 'replace',
                          replacement: product,
                          replacement_quantity:
                              product.unit === 'kg' ? '0.1' : '1',
                      }
                    : row,
            ),
        );
        setPicking({ kind: 'returned' });
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
        const pickingWhenStarted = pickingRef.current;

        try {
            const response = await window.axios.get<{ product: ReturnProduct }>(
                route('pos.lookup-product'),
                {
                    params:
                        productId !== undefined
                            ? { product_id: productId }
                            : { barcode: code },
                },
            );
            const product =
                products.find((row) => row.id === response.data.product.id) ??
                response.data.product;
            const pickingNow = pickingRef.current;

            if (pickingWhenStarted.kind === 'replacement') {
                if (
                    pickingNow.kind === 'replacement' &&
                    pickingNow.key === pickingWhenStarted.key
                ) {
                    assignReplacement(product, pickingNow.key);
                }
            } else if (pickingNow.kind === 'returned') {
                addReturned(product);
            }

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

    const updateLine = (key: string, patch: Partial<DraftLine>) => {
        setLines((current) =>
            current.map((line) => {
                if (line.key !== key) {
                    return line;
                }

                if (
                    patch.returned_quantity !== undefined &&
                    patch.returned_quantity !== '' &&
                    !isPieceQuantity(line.product.unit, Number(patch.returned_quantity))
                ) {
                    toast.error(
                        t('This product is sold by the piece. Use a whole number.'),
                    );
                    return line;
                }

                if (
                    patch.replacement_quantity !== undefined &&
                    patch.replacement_quantity !== '' &&
                    line.replacement &&
                    !isPieceQuantity(
                        line.replacement.unit,
                        Number(patch.replacement_quantity),
                    )
                ) {
                    toast.error(
                        t('This product is sold by the piece. Use a whole number.'),
                    );
                    return line;
                }

                const next = { ...line, ...patch };

                if (next.action === 'refund') {
                    next.replacement = null;
                    next.replacement_quantity = '1';
                }

                if (next.condition === 'sellable') {
                    next.supplier_id = '';
                } else if (next.supplier_id === '') {
                    next.supplier_id = next.product.last_supplier_id ?? '';
                }

                return next;
            }),
        );

        if (patch.action === 'refund' && picking.kind === 'replacement' && picking.key === key) {
            setPicking({ kind: 'returned' });
        }
    };

    const removeLine = (key: string) => {
        setLines((current) => current.filter((line) => line.key !== key));

        if (picking.kind === 'replacement' && picking.key === key) {
            setPicking({ kind: 'returned' });
        }
    };

    const lineError = (index: number): string | undefined => {
        const prefix = `items.${index}.`;
        const match = Object.entries(form.errors).find(([field]) =>
            field.startsWith(prefix),
        );

        return match?.[1];
    };

    const confirm = () => {
        if (busy) {
            return;
        }

        if (lines.length === 0) {
            toast.error(t('Scan the product they brought back.'));
            return;
        }

        for (const line of lines) {
            if ((Number(line.returned_quantity) || 0) < 0.001) {
                toast.error(t('Quantity must be greater than zero.'));
                return;
            }

            if (!isPieceQuantity(line.product.unit, Number(line.returned_quantity))) {
                toast.error(t('This product is sold by the piece. Use a whole number.'));
                return;
            }

            if (line.action === 'replace' && !line.replacement) {
                toast.error(t('Scan the product they take now.'));
                setPicking({ kind: 'replacement', key: line.key });
                return;
            }

            if (
                line.action === 'replace' &&
                (Number(line.replacement_quantity) || 0) < 0.001
            ) {
                toast.error(t('Quantity must be greater than zero.'));
                return;
            }

            if (
                line.action === 'replace' &&
                line.replacement &&
                !isPieceQuantity(
                    line.replacement.unit,
                    Number(line.replacement_quantity),
                )
            ) {
                toast.error(t('This product is sold by the piece. Use a whole number.'));
                return;
            }

            if (line.condition === 'defective' && line.supplier_id === '') {
                toast.error(t('Choose a supplier.'));
                return;
            }
        }

        if (cashDelta > 0 && form.data.amount_paid.trim() === '') {
            toast.error(t('Enter the amount paid.'));
            return;
        }

        if (cashDelta > 0 && paid + 0.001 < cashDelta) {
            toast.error(t('Amount paid is less than the total.'));
            return;
        }

        setSubmitting(true);
        form.transform(() => ({
            items: lines.map((line) => ({
                action: line.action,
                condition: line.condition,
                returned_product_id: line.product.id,
                returned_quantity: line.returned_quantity,
                replacement_product_id: line.replacement?.id ?? '',
                replacement_quantity:
                    line.action === 'replace' ? line.replacement_quantity : '',
                supplier_id:
                    line.condition === 'defective' ? line.supplier_id : '',
            })),
            amount_paid: form.data.amount_paid,
            reason: form.data.reason,
        }));
        form.post(route('returns.store'), {
            onFinish: () => {
                setSubmitting(false);
                form.transform((data) => data);
            },
            onSuccess: () => {
                form.reset();
                setLines([]);
                setPicking({ kind: 'returned' });
                setBarcode('');
            },
            onError: (errors) => {
                const extra = errors as typeof errors & {
                    items?: string;
                    cash_session?: string;
                };
                const message =
                    extra.cash_session ?? extra.items ?? extra.amount_paid;

                if (typeof message === 'string' && message !== '') {
                    toast.error(t(message));
                }
            },
        });
    };

    const giveToSupplier = (id: number) => {
        setGivingId(id);
        router.post(
            route('returns.give', id),
            {},
            {
                onFinish: () => setGivingId(null),
                onError: (errors) => {
                    const extra = errors as typeof errors & {
                        supplier_status?: string;
                    };
                    const message = extra.supplier_status;

                    if (typeof message === 'string' && message !== '') {
                        toast.error(t(message));
                    }
                },
            },
        );
    };

    return (
        <div className="space-y-6">
            <p className="text-muted-foreground">
                {t(
                    'They brought it back. Refund the money, or give them another product. Bad items stay off the shelf until the truck comes.',
                )}
            </p>

            <div className="grid gap-4 lg:grid-cols-[minmax(18rem,24rem)_1fr]">
                <Card className="min-h-0 gap-0 overflow-hidden py-0">
                    <CardHeader className="border-b py-4">
                        <CardTitle>{t('Returns')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 py-4">
                        <Field>
                            <FieldLabel htmlFor="scan_return_barcode" className="sr-only">
                                {t('Scan barcode')}
                            </FieldLabel>
                            <div className="relative">
                                <ScanLine className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                <BarcodeInput
                                    id="scan_return_barcode"
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
                            <p className="text-xs text-muted-foreground">
                                {picking.kind === 'replacement'
                                    ? t('Scan the product they take now.')
                                    : t('Scan the product they brought back.')}
                            </p>
                            <FieldError>
                                {extraErrors.items ? t(extraErrors.items) : null}
                            </FieldError>
                            <FieldError>
                                {cashSessionError ? t(cashSessionError) : null}
                            </FieldError>
                        </Field>

                        {lines.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                                {t('Scan or tap products to add them.')}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {lines.map((line, index) => (
                                    <ReturnLineCard
                                        key={line.key}
                                        line={line}
                                        error={lineError(index)}
                                        suppliers={suppliers}
                                        pickingReplacement={
                                            picking.kind === 'replacement' &&
                                            picking.key === line.key
                                        }
                                        disabled={busy}
                                        onPickReplacement={() =>
                                            setPicking({
                                                kind: 'replacement',
                                                key: line.key,
                                            })
                                        }
                                        onUpdate={(patch) => updateLine(line.key, patch)}
                                        onRemove={() => removeLine(line.key)}
                                    />
                                ))}
                            </div>
                        )}

                        {lines.length > 0 ? (
                            <div className="rounded-xl border bg-background p-3 text-sm">
                                <p>
                                    {t('Brought back')}: {formatMoney(returnedValue)}
                                </p>
                                {replacementValue > 0 ? (
                                    <p>
                                        {t('New product')}: {formatMoney(replacementValue)}
                                    </p>
                                ) : null}
                                <p className="mt-1 font-medium">
                                    {cashDelta > 0
                                        ? t('Customer pays :amount', {
                                              amount: formatMoney(cashDelta),
                                          })
                                        : cashDelta < 0
                                          ? t('Shop gives :amount', {
                                                amount: formatMoney(Math.abs(cashDelta)),
                                            })
                                          : t('Even swap — no cash')}
                                </p>
                                {cashDelta > 0 && paid > 0 && change < 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        {t('Need :amount more', {
                                            amount: formatMoney(shortfall),
                                        })}
                                    </p>
                                ) : cashDelta > 0 && paid > 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        {t('Paid :paid · Change :change', {
                                            paid: paid.toFixed(2),
                                            change: change.toFixed(2),
                                        })}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}

                        {cashDelta > 0 ? (
                            <Field>
                                <FieldLabel htmlFor="return_amount_paid">
                                    {t('Amount paid')}
                                </FieldLabel>
                                <Input
                                    id="return_amount_paid"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.amount_paid}
                                    onChange={(event) =>
                                        form.setData('amount_paid', event.target.value)
                                    }
                                />
                                <FieldError>
                                    {form.errors.amount_paid
                                        ? t(form.errors.amount_paid)
                                        : null}
                                </FieldError>
                            </Field>
                        ) : null}
                    </CardContent>
                    <CardFooter className="py-4">
                        <Button
                            type="button"
                            size="lg"
                            className="h-12 w-full"
                            disabled={busy || lines.length === 0}
                            onClick={confirm}
                        >
                            <Undo2 />
                            {t('Confirm return')}
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="min-h-0 min-w-0 gap-0 overflow-hidden py-0">
                    <CardHeader className="min-w-0 gap-3 overflow-hidden border-b py-4">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="ps-8"
                                placeholder={t('Search product')}
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>
                        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <Tabs
                                value={tab}
                                onValueChange={(value) => setTab(String(value))}
                                className="w-max min-w-full"
                            >
                                <TabsList className="h-9 w-max min-w-full justify-center">
                                    <TabsTrigger value="all" className="flex-none px-2">
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
                    </CardHeader>
                    <CardContent className="py-4">
                        {visibleProducts.length === 0 ? (
                            <p className="py-12 text-center text-sm text-muted-foreground">
                                {t('No products in this list.')}
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                                {visibleProducts.map((product) => {
                                    const outOfStock =
                                        Number(product.stock_quantity) <= 0;
                                    const sameSellable =
                                        picking.kind === 'replacement' &&
                                        (pickingReplacement?.product.id ===
                                            product.id &&
                                            pickingReplacement.condition ===
                                                'sellable');
                                    const coveredByReturn =
                                        picking.kind === 'replacement' &&
                                        sellableReturnedIds.has(product.id);
                                    const disabled =
                                        busy ||
                                        (picking.kind === 'replacement' &&
                                            outOfStock &&
                                            !sameSellable &&
                                            !coveredByReturn);
                                    const selected = lines.some(
                                        (line) =>
                                            line.product.id === product.id ||
                                            line.replacement?.id === product.id,
                                    );

                                    return (
                                        <button
                                            key={product.id}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => {
                                                void lookup({ productId: product.id });
                                            }}
                                            className={cn(
                                                'relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-background text-start outline-none transition hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
                                                selected && 'border-primary ring-2 ring-primary/30',
                                            )}
                                        >
                                            <div className="relative">
                                                <ProductThumb
                                                    src={product.image_url}
                                                    name={product.name}
                                                    className="h-20 w-full rounded-none object-cover sm:h-24"
                                                />
                                                {product.is_low_stock && !outOfStock ? (
                                                    <StockCornerBadge kind="low" />
                                                ) : outOfStock ? (
                                                    <StockCornerBadge kind="out" />
                                                ) : null}
                                            </div>
                                            <span className="truncate px-3 pt-2 text-sm font-medium">
                                                {product.name}
                                            </span>
                                            <span className="px-3 pb-3 text-xs text-muted-foreground">
                                                {Number(product.sale_price).toFixed(2)} MAD
                                                {product.unit === 'kg' ? t(' / kg') : ''}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                <h2 className="mb-3 text-lg font-semibold">
                    {t('Waiting for the company')}
                </h2>
                {waiting.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {t('No items waiting for the company.')}
                    </p>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('Product')}</TableHead>
                                    <TableHead>{t('Qty')}</TableHead>
                                    <TableHead>{t('Supplier')}</TableHead>
                                    <TableHead className="hidden md:table-cell">
                                        {t('When')}
                                    </TableHead>
                                    <TableHead>{t('Actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {waiting.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {row.returned_product}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {row.reference}
                                            </div>
                                        </TableCell>
                                        <TableCell>{row.returned_quantity}</TableCell>
                                        <TableCell>{row.supplier ?? '—'}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {row.created_at ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={givingId === row.id}
                                                onClick={() => giveToSupplier(row.id)}
                                            >
                                                {t('Give to supplier')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}

function ReturnLineCard({
    line,
    error,
    suppliers,
    pickingReplacement,
    disabled,
    onPickReplacement,
    onUpdate,
    onRemove,
}: {
    line: DraftLine;
    error?: string;
    suppliers: { id: number; name: string }[];
    pickingReplacement: boolean;
    disabled: boolean;
    onPickReplacement: () => void;
    onUpdate: (patch: Partial<DraftLine>) => void;
    onRemove: () => void;
}) {
    const t = useT();
    const isReplace = line.action === 'replace';
    const isDefective = line.condition === 'defective';

    return (
        <div className="flex flex-col gap-2 rounded-xl border bg-background p-2">
            <div className="flex flex-wrap items-center gap-2">
                <ProductThumb
                    src={line.product.image_url}
                    name={line.product.name}
                    className="size-11"
                />
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{t('Brought back')}</p>
                    <p className="truncate text-sm font-medium">{line.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {Number(line.product.sale_price).toFixed(2)} MAD
                        {line.product.unit === 'kg' ? t(' / kg') : ''}
                    </p>
                </div>
                <Input
                    className="h-8 w-16 text-center"
                    type="number"
                    min="0.001"
                    step={qtyStep(line.product.unit)}
                    value={line.returned_quantity}
                    disabled={disabled}
                    onChange={(event) =>
                        onUpdate({ returned_quantity: event.target.value })
                    }
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    disabled={disabled}
                    aria-label={t('Remove :name', { name: line.product.name })}
                    onClick={onRemove}
                >
                    <Trash2 />
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant={line.condition === 'sellable' ? 'default' : 'outline'}
                    disabled={disabled}
                    onClick={() => onUpdate({ condition: 'sellable' })}
                >
                    {t('Still good')}
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant={isDefective ? 'default' : 'outline'}
                    disabled={disabled}
                    onClick={() => onUpdate({ condition: 'defective' })}
                >
                    {t('Bad / expired')}
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant={line.action === 'refund' ? 'default' : 'outline'}
                    disabled={disabled}
                    onClick={() => onUpdate({ action: 'refund' })}
                >
                    {t('Refund cash')}
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant={isReplace ? 'default' : 'outline'}
                    disabled={disabled}
                    onClick={() => {
                        onUpdate({ action: 'replace' });
                        onPickReplacement();
                    }}
                >
                    {t('Replace')}
                </Button>
            </div>

            {isReplace ? (
                <div className="flex flex-wrap items-center gap-2">
                    {line.replacement ? (
                        <>
                            <button
                                type="button"
                                className={cn(
                                    'flex min-w-0 flex-1 items-center gap-2 rounded-xl border p-2 text-start',
                                    pickingReplacement &&
                                        'border-primary ring-2 ring-primary/30',
                                )}
                                onClick={onPickReplacement}
                            >
                                <ProductThumb
                                    src={line.replacement.image_url}
                                    name={line.replacement.name}
                                    className="size-9"
                                />
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                        {t('New product')}
                                    </p>
                                    <p className="truncate text-sm font-medium">
                                        {line.replacement.name}
                                    </p>
                                </div>
                            </button>
                            <Input
                                className="h-8 w-16 text-center"
                                type="number"
                                min="0.001"
                                step={qtyStep(line.replacement.unit)}
                                value={line.replacement_quantity}
                                disabled={disabled}
                                onChange={(event) =>
                                    onUpdate({
                                        replacement_quantity: event.target.value,
                                    })
                                }
                            />
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onPickReplacement}
                            className={cn(
                                'w-full rounded-xl border border-dashed p-3 text-start text-sm text-muted-foreground',
                                pickingReplacement &&
                                    'border-primary ring-2 ring-primary/30',
                            )}
                        >
                            {t('New product')}
                        </button>
                    )}
                </div>
            ) : null}

            {isDefective ? (
                <Field>
                    <FieldLabel htmlFor={`return_supplier_${line.key}`}>
                        {t('Supplier')}
                    </FieldLabel>
                    <select
                        id={`return_supplier_${line.key}`}
                        className={selectClassName}
                        value={String(line.supplier_id)}
                        disabled={disabled}
                        onChange={(event) =>
                            onUpdate({
                                supplier_id:
                                    event.target.value === ''
                                        ? ''
                                        : Number(event.target.value),
                            })
                        }
                    >
                        <option value="">{t('Supplier')}</option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                            </option>
                        ))}
                    </select>
                </Field>
            ) : null}

            {error ? <FieldError>{t(error)}</FieldError> : null}
        </div>
    );
}
