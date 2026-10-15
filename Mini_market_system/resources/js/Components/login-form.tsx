import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    Shield,
    User,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import * as React from 'react';

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const t = useT();
    const [showPassword, setShowPassword] = useState(false);
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
            <div className="rounded-3xl bg-[#1c2430]/80 px-8 py-8 text-white shadow-2xl backdrop-blur-sm">
                <div className="mb-6 flex flex-col items-center text-center">
                    <div className="flex size-[4.5rem] items-center justify-center rounded-full bg-[#d7e0ea] p-1">
                        <img
                            src="/images/logo.png?v=2"
                            alt=""
                            className="size-full object-contain"
                        />
                    </div>
                    <div className="mt-5 h-px w-12 bg-white/30" />
                    <p className="mt-5 text-lg font-semibold">{t('Hello!')}</p>
                    <p className="mt-1 text-sm text-white/70">
                        {t('Sign in to access your space.')}
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="sr-only">
                            {t('Username')}
                        </label>
                        <div className="relative">
                            <User className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-white/45" />
                            <Input
                                id="username"
                                type="text"
                                name="username"
                                value={data.username}
                                placeholder={t('Username')}
                                autoComplete="username"
                                autoFocus
                                required
                                aria-invalid={!!errors.username}
                                className="h-12 rounded-xl border-white/10 bg-[#151b24] ps-11 text-white placeholder:text-white/40 focus-visible:border-[#d7e0ea] focus-visible:ring-[#d7e0ea]/40"
                                onChange={(e) =>
                                    setData('username', e.target.value)
                                }
                            />
                        </div>
                        {errors.username ? (
                            <p className="mt-1.5 text-sm text-red-400">
                                {t(errors.username)}
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label htmlFor="password" className="sr-only">
                            {t('Password')}
                        </label>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-white/45" />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                placeholder={t('Password')}
                                autoComplete="current-password"
                                required
                                aria-invalid={!!errors.password}
                                className="h-12 rounded-xl border-white/10 bg-[#151b24] ps-11 pe-11 text-white placeholder:text-white/40 focus-visible:border-[#d7e0ea] focus-visible:ring-[#d7e0ea]/40"
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                            />
                            <button
                                type="button"
                                className="absolute end-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                                aria-label={
                                    showPassword
                                        ? t('Hide password')
                                        : t('Show password')
                                }
                                onClick={() => setShowPassword((open) => !open)}
                            >
                                {showPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>
                        {errors.password ? (
                            <p className="mt-1.5 text-sm text-red-400">
                                {t(errors.password)}
                            </p>
                        ) : null}
                    </div>

                    <label
                        htmlFor="remember"
                        className="flex items-center gap-2 text-sm text-white/70"
                    >
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) =>
                                setData('remember', checked === true)
                            }
                            className="border-white/30 data-checked:border-[#d7e0ea] data-checked:bg-[#d7e0ea] data-checked:text-[#1c2430]"
                        />
                        {t('Remember me')}
                    </label>

                    <Button
                        type="submit"
                        className="mt-2 h-12 w-full rounded-xl bg-[#d7e0ea] text-base font-semibold text-[#1c2430] hover:bg-white disabled:opacity-80"
                        disabled={processing}
                    >
                        {processing ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <ArrowRight className="rtl:rotate-180" />
                        )}
                        {processing ? t('Signing in') : t('Sign in')}
                    </Button>
                </form>

                <p className="mt-6 flex items-center justify-center gap-2 text-xs text-white/45">
                    <Shield className="size-3.5" />
                    {t('Your stock, our priority')}
                </p>
            </div>
        </div>
    );
}
