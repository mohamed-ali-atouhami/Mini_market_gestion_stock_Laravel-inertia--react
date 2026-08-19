import { LoginForm } from '@/Components/login-form';
import { Head } from '@inertiajs/react';
import { ShoppingBasket } from 'lucide-react';

export default function LoginPage({ status }: { status?: string }) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted px-6 py-12 md:px-10">
            <Head title="Log in" />

            <div className="flex w-full max-w-md flex-col items-center gap-8">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                        <ShoppingBasket className="size-4" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight">
                        Mini market
                    </span>
                </div>

                <LoginForm className="w-full" status={status} />
            </div>
        </div>
    );
}
