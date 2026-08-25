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
import { Link, router, usePage } from '@inertiajs/react';
import {
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
        name: 'Tickets sales',
        href: 'sales.index',
        match: 'sales.*',
        icon: Receipt,
        visible: ['owner'],
    },
    {
        name: 'Purchases ( المشتريات )',
        href: 'purchases.index',
        match: 'purchases.*',
        icon: PackagePlus,
        visible: ['owner'],
    },
    {
        name: 'Stock ( المخزن )',
        href: 'stock.index',
        match: 'stock.*',
        icon: Warehouse,
        visible: ['owner'],
    },
    {
        name: 'Products ( المنتجات )',
        href: 'products.index',
        match: 'products.*',
        icon: Package,
        visible: ['owner'],
    },
    {
        name: 'Categories ( الفئات )',
        href: 'categories.index',
        match: 'categories.*',
        icon: Tags,
        visible: ['owner'],
    },
    {
        name: 'Suppliers ( الموردين )',
        href: 'suppliers.index',
        match: 'suppliers.*',
        icon: Truck,
        visible: ['owner'],
    },
    {
        name: 'Reports ( التقارير )',
        href: 'reports.index',
        match: 'reports.*',
        icon: ChartColumn,
        visible: ['owner'],
    },
    {
        name: 'Users ( المستخدمين )',
        href: 'users.index',
        match: 'users.*',
        icon: Users,
        visible: ['owner'],
    },
];

export function currentPageTitle(): string | null {
    if (route().current('profile.edit')) {
        return 'Profile';
    }

    if (route().current('settings.*')) {
        return 'Settings';
    }

    if (route().current('sales.receipt')) {
        return 'Receipt';
    }

    const item = navigation.find((entry) => route().current(entry.match));

    return item ? item.name.split(' (')[0] : null;
}

export function AppSidebar() {
    const { auth, shop, cashSession } = usePage<PageProps>().props;
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
        <Sidebar collapsible="icon">
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
                    <SidebarGroupLabel>Shop</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {visibleItems.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <SidebarMenuItem key={item.name}>
                                        <SidebarMenuButton
                                            isActive={route().current(
                                                item.match,
                                            )}
                                            tooltip={item.name}
                                            render={
                                                <Link
                                                    href={route(item.href)}
                                                />
                                            }
                                        >
                                            <Icon />
                                            <span>{item.name}</span>
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
                            tooltip="Log out"
                            onClick={requestLogout}
                        >
                            <LogOut className="text-red-500" />
                            <span className="text-red-500">Log out</span>
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
                        <AlertDialogTitle>Close the caisse first</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your till is still open. Count the cash and close it
                            before you sign out.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Stay</AlertDialogCancel>
                        <AlertDialogCancel
                            variant="default"
                            onClick={goCloseCaisse}
                        >
                            {route().current('caisse.*')
                                ? 'OK'
                                : 'Go to caisse'}
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
