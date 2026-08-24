import BarcodeInput from '@/Components/forms/BarcodeInput';
import FormModal from '@/Components/forms/FormModal';
import { ProductNameCell } from '@/Components/ProductThumb';
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
import {
    CategoryOption,
    PurchaseLine,
    ScannedProduct,
    ShopPurchase,
} from '@/types';
import { formatInputNumber } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
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

function formatMoney(value: string | number): string {
    const amount = Number(value);

    return Number.isNaN(amount) ? '0.00' : amount.toFixed(2);
}

export default function PurchaseForm({
    suppliers,
    categories,
    purchase,
}: {
    suppliers: SupplierOption[];
    categories: CategoryOption[];
    purchase?: ShopPurchase;
}) {
    const barcodeRef = useRef<HTMLInputElement>(null);
    const [barcode, setBarcode] = useState('');
    const [scanning, setScanning] = useState(false);
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

    const total = form.data.items.reduce((sum, item) => {
        return sum + Number(item.quantity) * Number(item.unit_cost);
    }, 0);

    const addProduct = (product: ScannedProduct) => {
        const existing = form.data.items.find(
            (item) => item.product_id === product.id,
        );

        if (existing) {
            form.setData(
                'items',
                form.data.items.map((item) =>
                    item.product_id === product.id
                        ? {
                              ...item,
                              quantity: String(Number(item.quantity) + 1),
                          }
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
                unit_cost: formatInputNumber(product.cost_price) || '0',
                image_url: product.image_url ?? null,
            },
        ]);
    };

    const lookup = async (code: string) => {
        if (code === '' || scanning) {
            return;
        }

        setScanning(true);

        try {
            const response = await window.axios.get<{
                product: ScannedProduct;
            }>(route('purchases.lookup-product'), {
                params: { barcode: code },
            });
            addProduct(response.data.product);
            setBarcode('');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                setUnknownBarcode(code);
                setCreateOpen(true);
                toast.message('Product not found. Create it now.');
            } else {
                toast.error('Could not look up this barcode.');
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
        form.setData(
            'items',
            form.data.items.map((item) =>
                item.product_id === productId
                    ? { ...item, [field]: value }
                    : item,
            ),
        );
    };

    const removeLine = (productId: number) => {
        form.setData(
            'items',
            form.data.items.filter((item) => item.product_id !== productId),
        );
    };

    const submit = (receive: boolean) => {
        form.transform((data) => ({ ...data, receive }));

        const options = {
            preserveScroll: true,
        };

        if (purchase) {
            form.patch(route('purchases.update', purchase.id), options);
            return;
        }

        form.post(route('purchases.store'), options);
    };

    const title = purchase
        ? `Draft ${purchase.reference}`
        : 'New delivery';

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">{title}</h1>
                    <p className="mt-1 text-muted-foreground">
                        Scan products, set quantities, then receive to update
                        stock.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                        <FieldGroup>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field>
                                    <FieldLabel htmlFor="supplier_id">
                                        Supplier
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
                                                Create a supplier first
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
                                        {form.errors.supplier_id}
                                    </FieldError>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="purchase_date">
                                        Date
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
                                    <FieldError>
                                        {form.errors.purchase_date}
                                    </FieldError>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="invoice_number">
                                        Invoice number
                                    </FieldLabel>
                                    <Input
                                        id="invoice_number"
                                        value={form.data.invoice_number}
                                        onChange={(e) =>
                                            form.setData(
                                                'invoice_number',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <FieldError>
                                        {form.errors.invoice_number}
                                    </FieldError>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="notes">Notes</FieldLabel>
                                    <Input
                                        id="notes"
                                        value={form.data.notes}
                                        onChange={(e) =>
                                            form.setData(
                                                'notes',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <FieldError>
                                        {form.errors.notes}
                                    </FieldError>
                                </Field>
                            </div>
                        </FieldGroup>
                    </div>

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
                                onScan={lookup}
                                disabled={scanning}
                            />
                            <p className="text-xs text-muted-foreground">
                                Scanner types the code and Enter. Same product
                                scanned again adds +1.
                            </p>
                            <FieldError>{form.errors.items}</FieldError>
                        </Field>

                        <div className="mt-4 rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="hidden md:table-cell">
                                            Barcode
                                        </TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Cost</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.data.items.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-20 text-center text-muted-foreground"
                                            >
                                                Scan a product to add it.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        form.data.items.map((item) => (
                                            <TableRow key={item.product_id}>
                                                <TableCell>
                                                    <ProductNameCell
                                                        src={item.image_url}
                                                        name={item.name}
                                                    />
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {item.barcode ?? '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        className="w-20"
                                                        type="number"
                                                        min="0.001"
                                                        step="0.001"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateLine(
                                                                item.product_id,
                                                                'quantity',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        className="w-24"
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
                                                </TableCell>
                                                <TableCell>
                                                    {formatMoney(
                                                        Number(item.quantity) *
                                                            Number(
                                                                item.unit_cost,
                                                            ),
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() =>
                                                            removeLine(
                                                                item.product_id,
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

                        <div className="mt-4 flex justify-end text-sm font-medium">
                            Total: {formatMoney(total)} MAD
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <ButtonLink
                            variant="ghost"
                            href={route('purchases.index')}
                        >
                            Cancel
                        </ButtonLink>
                        {purchase && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.post(
                                        route('purchases.cancel', purchase.id),
                                    )
                                }
                                disabled={form.processing}
                            >
                                Cancel draft
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            disabled={form.processing}
                            onClick={() => submit(false)}
                        >
                            Save draft
                        </Button>
                        <Button
                            type="button"
                            disabled={form.processing}
                            onClick={() => submit(true)}
                        >
                            Receive
                        </Button>
                    </div>
                </form>
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
