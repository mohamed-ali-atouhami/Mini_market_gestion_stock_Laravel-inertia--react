import FlashToasts from '@/Components/FlashToasts';
import { LoginForm } from '@/Components/login-form';
import { useT } from '@/lib/i18n';
import { Head } from '@inertiajs/react';

export default function LoginPage() {
    const t = useT();

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-6 md:px-10">
            <img
                src="/images/sign-in-bg.jpg"
                alt=""
                className="pointer-events-none absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-black/25" />
            <Head title={t('Sign in')} />
            <FlashToasts />

            <LoginForm className="relative z-10 w-full max-w-[420px]" />
        </div>
    );
}
