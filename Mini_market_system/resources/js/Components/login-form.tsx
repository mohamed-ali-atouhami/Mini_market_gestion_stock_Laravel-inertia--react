import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
} from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import * as React from 'react';
import { FormEventHandler } from 'react';

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const t = useT();
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className={cn('flex flex-col', className)} {...props}>
            <Card className="py-8 shadow-sm">
                <CardContent className="px-8 pt-2">
                    <form onSubmit={submit}>
                        <FieldGroup className="gap-6">
                            <Field
                                data-invalid={
                                    errors.username ? true : undefined
                                }
                            >
                                <FieldLabel htmlFor="username">
                                    {t('Username')}
                                </FieldLabel>
                                <Input
                                    id="username"
                                    type="text"
                                    name="username"
                                    value={data.username}
                                    placeholder={t('Enter your username')}
                                    autoComplete="username"
                                    autoFocus
                                    required
                                    aria-invalid={!!errors.username}
                                    className="h-10"
                                    onChange={(e) =>
                                        setData('username', e.target.value)
                                    }
                                />
                                <FieldError>{errors.username}</FieldError>
                            </Field>

                            <Field
                                data-invalid={
                                    errors.password ? true : undefined
                                }
                            >
                                <FieldLabel htmlFor="password">
                                    {t('Password')}
                                </FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    placeholder={t('Enter your password')}
                                    autoComplete="current-password"
                                    required
                                    aria-invalid={!!errors.password}
                                    className="h-10"
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />
                                <FieldError>{errors.password}</FieldError>
                            </Field>

                            <Field orientation="horizontal">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    checked={data.remember}
                                    onCheckedChange={(checked) =>
                                        setData('remember', checked === true)
                                    }
                                />
                                <FieldLabel
                                    htmlFor="remember"
                                    className="font-normal"
                                >
                                    {t('Remember me')}
                                </FieldLabel>
                            </Field>

                            <Field className="pt-1">
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full"
                                    disabled={processing}
                                >
                                    {t('Login')}
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
