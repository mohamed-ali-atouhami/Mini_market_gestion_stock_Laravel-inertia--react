import FlashToasts from '@/Components/FlashToasts';
import { AppSidebar } from '@/Components/layout/AppSidebar';
import { HeaderUserMenu } from '@/Components/layout/HeaderUserMenu';
import { LanguageSwitcher } from '@/Components/layout/LanguageSwitcher';
import { Badge } from '@/Components/ui/badge';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/Components/ui/sidebar';
import { useT } from '@/lib/i18n';
import { PageProps, ShopPurchase } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Clock, ShoppingCartIcon, TextAlignStart } from 'lucide-react';
import { PropsWithChildren, useEffect, useState } from 'react';

function useClock(): string {
    const [time, setTime] = useState(() =>
        new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }),
    );

    useEffect(() => {
        const id = window.setInterval(() => {
            setTime(
                new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }),
            );
        }, 1000);

        return () => window.clearInterval(id);
    }, []);

    return time;
}

export default function PosLayout({
    children,
    till = 'pos',
}: PropsWithChildren<{ till?: 'pos' | 'delivery' }>) {
    const { auth, shop, purchase, cashSession } = usePage<
        PageProps & { purchase?: ShopPurchase }
    >().props;
    const t = useT();
    const clock = useClock();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isDelivery = till === 'delivery';
    const deliveryHeading = purchase?.reference
        ? t('Draft :reference', { reference: purchase.reference })
        : t('New delivery');

    if (!auth.user) {
        return null;
    }

    return (
        <SidebarProvider
            open={sidebarOpen}
            onOpenChange={setSidebarOpen}
            defaultOpen={false}
            className="min-h-svh lg:h-svh lg:min-h-0 lg:overflow-hidden"
        >
            <Head title={isDelivery ? deliveryHeading : t('POS')} />
            <FlashToasts />
            <AppSidebar collapsible="offcanvas" />
            <SidebarInset className="min-h-0 bg-muted/40 lg:overflow-hidden">
                <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:gap-3 sm:px-4">
                    <SidebarTrigger>
                        <TextAlignStart className="size-4" />
                    </SidebarTrigger>
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                        <ShoppingCartIcon
                            className="size-4 text-muted-foreground"
                        />
                        <span className="truncate text-sm font-semibold">
                            {shop?.name || 'Mini market'}
                        </span>
                        {isDelivery ? (
                            <>
                                <span className="text-muted-foreground">|</span>
                                <span className="truncate text-sm text-muted-foreground">
                                    {deliveryHeading}
                                </span>
                            </>
                        ) : cashSession ? (
                            <>
                                <Badge
                                    variant="default"
                                    className="hidden gap-1.5 bg-emerald-500/10 font-normal sm:inline-flex"
                                >
                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-emerald-500">
                                        {t('Caisse open')}
                                    </span>
                                </Badge>
                                <span className="size-1.5 shrink-0 rounded-full bg-emerald-500 sm:hidden" />
                            </>
                        ) : null}
                    </div>
                    <LanguageSwitcher />
                    <HeaderUserMenu user={auth.user} />
                    <div className="hidden items-center gap-1.5 text-sm leading-none text-muted-foreground sm:flex">
                        <Clock className="size-4 shrink-0" />
                        <span className="tabular-nums">{clock}</span>
                    </div>
                </header>
                <div className="flex min-h-0 flex-1 flex-col p-3 md:p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
