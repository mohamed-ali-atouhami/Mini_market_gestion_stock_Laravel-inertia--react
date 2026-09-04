import FlashToasts from '@/Components/FlashToasts';
import { LoginForm } from '@/Components/login-form';
import { useT } from '@/lib/i18n';
import { Head } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';

export default function LoginPage() {
    const t = useT();

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted px-6 py-12 md:px-10">
            <Head title={t('Log in')} />
            <FlashToasts />

            <div className="flex w-full max-w-md flex-col items-center gap-8">
                <div className="flex w-full items-center gap-2.5">
                    <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <ShoppingCart className="size-4" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight">
                        Mini market
                    </span>
                </div>

                <LoginForm className="w-full" />
            </div>
        </div>
    );
}
