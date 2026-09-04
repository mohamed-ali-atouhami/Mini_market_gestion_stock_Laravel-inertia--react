import FlashToasts from '@/Components/FlashToasts';
import {
    AppSidebar,
    usePageTitle,
} from '@/Components/layout/AppSidebar';
import { HeaderUserMenu } from '@/Components/layout/HeaderUserMenu';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/Components/ui/sidebar';
import { Separator } from '@/Components/ui/separator';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Clock, ShoppingCartIcon, TextAlignStart } from 'lucide-react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';

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

export default function AuthenticatedLayout({
    header,
    children,
    tillHeader = false,
}: PropsWithChildren<{ header?: ReactNode; tillHeader?: boolean }>) {
    const { auth, shop } = usePage<PageProps>().props;
    const resolvedTitle = usePageTitle();
    const pageTitle = header ?? resolvedTitle;
    const clock = useClock();

    if (!auth.user) {
        return null;
    }

    return (
        <SidebarProvider>
            {typeof pageTitle === 'string' ? <Head title={pageTitle} /> : null}
            <FlashToasts />
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
                    <SidebarTrigger>
                        <TextAlignStart className="size-4" />
                    </SidebarTrigger>
                    {tillHeader ? (
                        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                            <ShoppingCartIcon className="size-4 text-muted-foreground" />
                            <span className="truncate text-sm font-semibold">
                                {shop?.name || 'Mini market'}
                            </span>
                            {pageTitle ? (
                                <>
                                    <span className="text-muted-foreground">
                                        |
                                    </span>
                                    <span className="truncate text-sm text-muted-foreground">
                                        {pageTitle}
                                    </span>
                                </>
                            ) : null}
                        </div>
                    ) : (
                        <>
                            <Separator
                                orientation="vertical"
                                className="h-4 self-auto"
                            />
                            {pageTitle ? (
                                <div className="flex-1 text-sm font-medium">
                                    {pageTitle}
                                </div>
                            ) : (
                                <div className="flex-1" />
                            )}
                        </>
                    )}
                    <HeaderUserMenu user={auth.user} />
                    {tillHeader ? (
                        <div className="hidden items-center gap-1.5 text-sm leading-none text-muted-foreground sm:flex">
                            <Clock className="size-4 shrink-0" />
                            <span className="tabular-nums">{clock}</span>
                        </div>
                    ) : null}
                </header>
                <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
