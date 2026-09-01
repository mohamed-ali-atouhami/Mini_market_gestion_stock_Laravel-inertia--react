import { PageProps } from '@/types';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/Components/ui/sidebar';
import { useDirection } from '@/Components/ui/direction';
import { useLocale, useT } from '@/lib/i18n';
import { Link, router, usePage } from '@inertiajs/react';
import {
    HandCoins,
    Landmark,
    ChartColumn,
    LayoutDashboard,
    LogOut,
    Package,
    PackagePlus,
    Receipt,
    ScanLine,
    ShoppingCart,
    Tags,
    Truck,
    Undo2,
    Users,
    Warehouse,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

type RoleSlug = 'owner' | 'cashier';

type NavigationItem = {
    name: string;
    href: string;
    match: string;
    icon: LucideIcon;
    visible: RoleSlug[];
};

const navigation: NavigationItem[] = [
    {
        name: 'Dashboard',
        href: 'dashboard',
        match: 'dashboard',
        icon: LayoutDashboard,
        visible: ['owner', 'cashier'],
    },
    {
        name: 'POS',
        href: 'pos.index',
        match: 'pos.*',
        icon: ScanLine,
        visible: ['owner', 'cashier'],
    },
    {
        name: 'Caisse',
        href: 'caisse.index',
        match: 'caisse.*',
        icon: Landmark,
        visible: ['owner', 'cashier'],
    },
    {
        name: 'Credit',
        href: 'credits.index',
        match: 'credits.*',
        icon: HandCoins,
        visible: ['owner', 'cashier'],
    },
    {
        name: 'Returns',
        href: 'returns.index',
        match: 'returns.*',
        icon: Undo2,
        visible: ['owner', 'cashier'],
    },
    {
        name: 'Tickets sales',
        href: 'sales.index',
        match: 'sales.*',
        icon: Receipt,
        visible: ['owner'],
    },
    {
        name: 'Purchases',
        href: 'purchases.index',
        match: 'purchases.*',
        icon: PackagePlus,
        visible: ['owner'],
    },
    {
        name: 'Stock',
        href: 'stock.index',
        match: 'stock.*',
        icon: Warehouse,
        visible: ['owner'],
    },
    {
        name: 'Products',
        href: 'products.index',
        match: 'products.*',
        icon: Package,
        visible: ['owner'],
    },
    {
        name: 'Categories',
        href: 'categories.index',
        match: 'categories.*',
        icon: Tags,
        visible: ['owner'],
    },
    {
        name: 'Suppliers',
        href: 'suppliers.index',
        match: 'suppliers.*',
        icon: Truck,
        visible: ['owner'],
    },
    {
        name: 'Reports',
        href: 'reports.index',
        match: 'reports.*',
        icon: ChartColumn,
        visible: ['owner'],
    },
    {
        name: 'Users',
        href: 'users.index',
        match: 'users.*',
        icon: Users,
        visible: ['owner'],
    },
];

export function usePageTitle(): string | null {
    const t = useT();

    if (route().current('profile.edit')) {
        return t('Profile');
    }

    if (route().current('settings.*')) {
        return t('Settings');
    }

    if (route().current('sales.receipt')) {
        return t('Receipt');
    }

    const item = navigation.find((entry) => route().current(entry.match));

    return item ? t(item.name) : null;
}

export function AppSidebar({
    collapsible = 'icon',
}: {
    collapsible?: 'offcanvas' | 'icon' | 'none';
}) {
    const { auth, shop, cashSession } = usePage<PageProps>().props;
    const t = useT();
    const locale = useLocale();
    const direction = useDirection();
    const user = auth.user;
    const role = user?.role as RoleSlug | null | undefined;
    const shopName = shop?.name || 'Mini market';
    const [closeCaisseOpen, setCloseCaisseOpen] = useState(false);
    const { setOpenMobile } = useSidebar();

    const visibleItems = navigation.filter((item) => {
        if (!role) {
            return false;
        }

        return item.visible.includes(role);
    });

    const requestLogout = () => {
        if (cashSession) {
            setOpenMobile(false);
            setCloseCaisseOpen(true);
            return;
        }

        router.post(route('logout'));
    };

    const goCloseCaisse = () => {
        setCloseCaisseOpen(false);

        if (!route().current('caisse.*')) {
            router.visit(route('caisse.index'));
        }
    };

    return (
        <>
        <Sidebar
            collapsible={collapsible}
            side={locale === 'ar' ? 'right' : 'left'}
            dir={direction}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            tooltip={shopName}
                            className="group-data-[collapsible=icon]:p-2!"
                            render={<Link href={route('dashboard')} />}
                        >
                            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground group-data-[collapsible=icon]:size-4 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:text-current">
                                <ShoppingCart className="size-4" />
                            </div>
                            <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
                                {shopName}
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>{t('Shop')}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {visibleItems.map((item) => {
                                const Icon = item.icon;
                                const label = t(item.name);

                                return (
                                    <SidebarMenuItem key={item.name}>
                                        <SidebarMenuButton
                                            isActive={route().current(
                                                item.match,
                                            )}
                                            tooltip={label}
                                            render={
                                                <Link
                                                    href={route(item.href)}
                                                />
                                            }
                                        >
                                            <Icon />
                                            <span>{label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip={t('Log out')}
                            onClick={requestLogout}
                        >
                            <LogOut className="text-red-500" />
                            <span className="text-red-500">{t('Log out')}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
            <AlertDialog
                open={closeCaisseOpen}
                onOpenChange={setCloseCaisseOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogMedia className="bg-orange-500/10 text-orange-600">
                            <Landmark />
                        </AlertDialogMedia>
                        <AlertDialogTitle>
                            {t('Close the caisse first')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'Your till is still open. Count the cash and close it before you sign out.',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('Stay')}</AlertDialogCancel>
                        <AlertDialogCancel
                            variant="default"
                            onClick={goCloseCaisse}
                        >
                            {route().current('caisse.*')
                                ? t('OK')
                                : t('Go to caisse')}
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
