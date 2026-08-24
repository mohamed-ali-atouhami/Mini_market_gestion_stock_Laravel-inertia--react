import BarcodeInput from '@/Components/forms/BarcodeInput';
import { ProductThumb } from '@/Components/ProductThumb';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { CategoryOption, PageProps, ScannedProduct, ShopProduct } from '@/types';
import { formatInputNumber } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

const selectClassName =
    'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export default function ProductForm({
    type,
    data,
    categories,
    setOpen,
    returnTo,
    initialBarcode,
    onCreated,
}: {
    type: 'create' | 'edit';
    data?: ShopProduct | null;
    categories: CategoryOption[];
    setOpen: (open: boolean) => void;
    returnTo?: string;
    initialBarcode?: string;
    onCreated?: (product: ScannedProduct) => void;
}) {
    const fromPurchases = returnTo === 'purchases';
    const [preview, setPreview] = useState<string | null>(
        data?.image_url ?? null,
    );

    useEffect(() => {
        return () => {
            if (preview?.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const form = useForm({
        name: data?.name ?? '',
        category_id: data?.category_id ?? categories[0]?.id ?? 0,
        barcode: data?.barcode ?? initialBarcode ?? '',
        cost_price: formatInputNumber(data?.cost_price),
        sale_price: formatInputNumber(data?.sale_price),
        stock_quantity: fromPurchases ? '0' : (formatInputNumber(data?.stock_quantity) || '0'),
        min_stock: formatInputNumber(data?.min_stock) || '0',
        unit: data?.unit ?? 'piece',
        is_active: data?.is_active ?? true,
        image: null as File | null,
        remove_image: false,
        return_to: returnTo ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        form.transform((values) => {
            const payload: Record<string, unknown> = { ...values };

            if (!(payload.image instanceof File)) {
                delete payload.image;
            }

            payload.is_active = values.is_active ? 1 : 0;

            if (values.remove_image) {
                payload.remove_image = 1;
            } else {
                delete payload.remove_image;
            }

            if (type === 'edit') {
                payload._method = 'patch';
            }

            return payload;
        });

        if (type === 'create') {
            form.post(route('products.store'), {
                forceFormData: true,
                preserveScroll: true,
                preserveState: fromPurchases,
                onSuccess: (page) => {
                    setOpen(false);
                    const created = (page.props as PageProps).flash
                        .created_product;
                    if (created) {
                        onCreated?.(created);
                    }
                },
            });
            return;
        }

        if (!data) {
            return;
        }

        form.post(route('products.update', data.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <form onSubmit={submit}>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                        id="name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        required
                        autoFocus
                    />
                    <FieldError>{form.errors.name}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="category_id">Category</FieldLabel>
                    <select
                        id="category_id"
                        className={selectClassName}
                        value={form.data.category_id}
                        onChange={(e) =>
                            form.setData('category_id', Number(e.target.value))
                        }
                    >
                        {categories.length === 0 ? (
                            <option value={0}>Create a category first</option>
                        ) : (
                            categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))
                        )}
                    </select>
                    <FieldError>{form.errors.category_id}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="barcode">Barcode</FieldLabel>
                    <BarcodeInput
                        id="barcode"
                        value={form.data.barcode}
                        onChange={(value) => form.setData('barcode', value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Scan with the USB scanner (it types the code and Enter)
                        or type it by hand.
                    </p>
                    <FieldError>{form.errors.barcode}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="image">Photo</FieldLabel>
                    <div className="flex items-center gap-3">
                        <ProductThumb
                            src={preview}
                            name={form.data.name || 'Product'}
                            className="size-16"
                        />
                        <Input
                            id="image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                form.setData('image', file);
                                form.setData('remove_image', false);
                                setPreview(
                                    file
                                        ? URL.createObjectURL(file)
                                        : (data?.image_url ?? null),
                                );
                            }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Optional. JPEG, PNG or WebP, up to 2 MB.
                    </p>
                    {type === 'edit' &&
                    data?.image_url &&
                    form.data.image === null ? (
                        <Field orientation="horizontal">
                            <Checkbox
                                id="remove_image"
                                checked={form.data.remove_image}
                                onCheckedChange={(checked) => {
                                    const remove = checked === true;
                                    form.setData('remove_image', remove);
                                    setPreview(remove ? null : data.image_url);
                                }}
                            />
                            <FieldLabel
                                htmlFor="remove_image"
                                className="font-normal"
                            >
                                Remove photo
                            </FieldLabel>
                        </Field>
                    ) : null}
                    <FieldError>{form.errors.image}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="cost_price">Cost price (MAD)</FieldLabel>
                    <Input
                        id="cost_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.data.cost_price}
                        onChange={(e) =>
                            form.setData('cost_price', e.target.value)
                        }
                        required
                    />
                    <FieldError>{form.errors.cost_price}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="sale_price">Sale price (MAD)</FieldLabel>
                    <Input
                        id="sale_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.data.sale_price}
                        onChange={(e) =>
                            form.setData('sale_price', e.target.value)
                        }
                        required
                    />
                    <FieldError>{form.errors.sale_price}</FieldError>
                </Field>
                {!fromPurchases && (
                <Field>
                    <FieldLabel htmlFor="stock_quantity">Stock</FieldLabel>
                    <Input
                        id="stock_quantity"
                        type="number"
                        min="0"
                        step="0.001"
                        value={form.data.stock_quantity}
                        onChange={(e) =>
                            form.setData('stock_quantity', e.target.value)
                        }
                        disabled={type === 'edit'}
                    />
                    <p className="text-xs text-muted-foreground">
                        {type === 'create'
                            ? 'Starting quantity. After this, stock changes only when you receive or sell.'
                            : 'Stock is updated by purchases and sales, not here.'}
                    </p>
                    <FieldError>{form.errors.stock_quantity}</FieldError>
                </Field>
                )}
                <Field>
                    <FieldLabel htmlFor="min_stock">Min stock</FieldLabel>
                    <Input
                        id="min_stock"
                        type="number"
                        min="0"
                        step="0.001"
                        value={form.data.min_stock}
                        onChange={(e) =>
                            form.setData('min_stock', e.target.value)
                        }
                        required
                    />
                    <FieldError>{form.errors.min_stock}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="unit">Unit</FieldLabel>
                    <select
                        id="unit"
                        className={selectClassName}
                        value={form.data.unit}
                        onChange={(e) => form.setData('unit', e.target.value)}
                    >
                        <option value="piece">Piece</option>
                        <option value="kg">Kg</option>
                    </select>
                    <FieldError>{form.errors.unit}</FieldError>
                </Field>
                <Field orientation="horizontal">
                    <Checkbox
                        id="is_active"
                        checked={form.data.is_active}
                        onCheckedChange={(checked) =>
                            form.setData('is_active', checked === true)
                        }
                    />
                    <FieldLabel htmlFor="is_active" className="font-normal">
                        Active (can be sold)
                    </FieldLabel>
                </Field>
                <FieldError>{form.errors.is_active}</FieldError>
                <Field>
                    <Button type="submit" disabled={form.processing}>
                        {type === 'create' ? 'Create product' : 'Save'}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    );
}
