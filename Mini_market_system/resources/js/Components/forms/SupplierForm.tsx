import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { ShopSupplier } from '@/types';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function SupplierForm({
    type,
    data,
    setOpen,
}: {
    type: 'create' | 'edit';
    data?: ShopSupplier | null;
    setOpen: (open: boolean) => void;
}) {
    const form = useForm({
        name: data?.name ?? '',
        phone: data?.phone ?? '',
        address: data?.address ?? '',
        notes: data?.notes ?? '',
        is_active: data?.is_active ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (type === 'create') {
            form.post(route('suppliers.store'), {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
            });
            return;
        }

        if (!data) {
            return;
        }

        form.patch(route('suppliers.update', data.id), {
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
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>
                    <Input
                        id="phone"
                        value={form.data.phone}
                        onChange={(e) => form.setData('phone', e.target.value)}
                    />
                    <FieldError>{form.errors.phone}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="address">Address</FieldLabel>
                    <Input
                        id="address"
                        value={form.data.address}
                        onChange={(e) => form.setData('address', e.target.value)}
                    />
                    <FieldError>{form.errors.address}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="notes">Notes</FieldLabel>
                    <Input
                        id="notes"
                        value={form.data.notes}
                        onChange={(e) => form.setData('notes', e.target.value)}
                    />
                    <FieldError>{form.errors.notes}</FieldError>
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
                        Active
                    </FieldLabel>
                </Field>
                <FieldError>{form.errors.is_active}</FieldError>
                <Field>
                    <Button type="submit" disabled={form.processing}>
                        {type === 'create' ? 'Create supplier' : 'Save'}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    );
}
