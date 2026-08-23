import { PageProps } from '@/types';
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
    Settings,
    ShoppingCart,
    Tags,
    Truck,
    UserRound,
    Users,
    Warehouse,
    type LucideIcon,
} from 'lucide-react';

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
        name: 'Settings ( الإعدادات )',
        href: 'settings.edit',
        match: 'settings.*',
        icon: Settings,
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

export function AppSidebar() {
    const { auth, shop } = usePage<PageProps>().props;
    const user = auth.user;
    const role = user?.role as RoleSlug | null | undefined;
    const shopName = shop?.name || 'Mini market';

    const visibleItems = navigation.filter((item) => {
        if (!role) {
            return false;
        }

        return item.visible.includes(role);
    });

    return (
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
                            isActive={route().current('profile.edit')}
                            tooltip="Profile"
                            render={<Link href={route('profile.edit')} />}
                        >
                            <UserRound />
                            <span>{user?.name ?? 'Profile'}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Log out"
                            onClick={() => router.post(route('logout'))}
                        >
                            <LogOut />
                            <span>Log out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
