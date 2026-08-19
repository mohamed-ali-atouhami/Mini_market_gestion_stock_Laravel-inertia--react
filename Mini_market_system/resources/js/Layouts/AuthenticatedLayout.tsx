import FlashToasts from '@/Components/FlashToasts';
import { AppSidebar } from '@/Components/layout/AppSidebar';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/Components/ui/sidebar';
import { Separator } from '@/Components/ui/separator';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage<PageProps>().props;

    if (!auth.user) {
        return null;
    }

    return (
        <SidebarProvider>
            <FlashToasts />
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="h-4 self-auto" />
                    {header ? (
                        <div className="flex-1 text-sm font-medium">
                            {header}
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
