import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { ShopCategory } from '@/types';
import { useT } from '@/lib/i18n';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function CategoryForm({
    type,
    data,
    setOpen,
}: {
    type: 'create' | 'edit';
    data?: ShopCategory | null;
    setOpen: (open: boolean) => void;
}) {
    const t = useT();
    const form = useForm({
        name: data?.name ?? '',
        is_active: data?.is_active ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (type === 'create') {
            form.post(route('categories.store'), {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
            });
            return;
        }

        if (!data) {
            return;
        }

        form.patch(route('categories.update', data.id), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <form onSubmit={submit}>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="name">{t('Name')}</FieldLabel>
                    <Input
                        id="name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        required
                        autoFocus
                    />
                    <FieldError>{form.errors.name}</FieldError>
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
                        {t('Active')}
                    </FieldLabel>
                </Field>
                <FieldError>{form.errors.is_active}</FieldError>
                <Field>
                    <Button type="submit" disabled={form.processing}>
                        {type === 'create' ? t('Create category') : t('Save')}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    );
}
