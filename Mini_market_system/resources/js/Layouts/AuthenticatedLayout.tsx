import FlashToasts from '@/Components/FlashToasts';
import {
    AppSidebar,
    currentPageTitle,
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
import { TextAlignStart } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage<PageProps>().props;
    const pageTitle = header ?? currentPageTitle();

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
                    <Separator orientation="vertical" className="h-4 self-auto" />
                    {pageTitle ? (
                        <div className="flex-1 text-sm font-medium">
                            {pageTitle}
                        </div>
                    ) : (
                        <div className="flex-1" />
                    )}
                    <HeaderUserMenu user={auth.user} />
                </header>
                <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
