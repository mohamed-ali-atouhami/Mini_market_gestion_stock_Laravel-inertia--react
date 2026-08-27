import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { RoleOption, ShopUser } from '@/types';
import { useT } from '@/lib/i18n';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const selectClassName =
    'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export default function UserForm({
    type,
    data,
    roles,
    setOpen,
}: {
    type: 'create' | 'edit';
    data?: ShopUser | null;
    roles: RoleOption[];
    setOpen: (open: boolean) => void;
}) {
    const t = useT();
    const form = useForm({
        name: data?.name ?? '',
        username: data?.username ?? '',
        password: '',
        password_confirmation: '',
        role_id: data?.role_id ?? roles[0]?.id ?? 0,
        is_active: data?.is_active ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (type === 'create') {
            form.post(route('users.store'), {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
            });
            return;
        }

        if (!data) {
            return;
        }

        form.patch(route('users.update', data.id), {
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
                <Field>
                    <FieldLabel htmlFor="username">{t('Username')}</FieldLabel>
                    <Input
                        id="username"
                        value={form.data.username}
                        onChange={(e) =>
                            form.setData('username', e.target.value)
                        }
                        required
                        autoComplete="off"
                    />
                    <FieldError>{form.errors.username}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="password">
                        {type === 'edit'
                            ? t('New password (optional)')
                            : t('Password')}
                    </FieldLabel>
                    <Input
                        id="password"
                        type="password"
                        value={form.data.password}
                        onChange={(e) =>
                            form.setData('password', e.target.value)
                        }
                        required={type === 'create'}
                        autoComplete="new-password"
                    />
                    <FieldError>{form.errors.password}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="password_confirmation">
                        {t('Confirm password')}
                    </FieldLabel>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={form.data.password_confirmation}
                        onChange={(e) =>
                            form.setData(
                                'password_confirmation',
                                e.target.value,
                            )
                        }
                        required={type === 'create'}
                        autoComplete="new-password"
                    />
                    <FieldError>
                        {form.errors.password_confirmation}
                    </FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="role_id">{t('Role')}</FieldLabel>
                    <select
                        id="role_id"
                        className={selectClassName}
                        value={form.data.role_id}
                        onChange={(e) =>
                            form.setData('role_id', Number(e.target.value))
                        }
                    >
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {t(role.name)}
                            </option>
                        ))}
                    </select>
                    <FieldError>{form.errors.role_id}</FieldError>
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
                        {t('Active (can log in)')}
                    </FieldLabel>
                </Field>
                <FieldError>{form.errors.is_active}</FieldError>
                <Field>
                    <Button type="submit" disabled={form.processing}>
                        {type === 'create' ? t('Create user') : t('Save')}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    );
}
