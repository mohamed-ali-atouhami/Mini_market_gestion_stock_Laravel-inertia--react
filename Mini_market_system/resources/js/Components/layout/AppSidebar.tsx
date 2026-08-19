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
    LayoutDashboard,
    LogOut,
    Package,
    ShoppingBasket,
    Tags,
    Truck,
    UserRound,
    Users,
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
        name: 'Users',
        href: 'users.index',
        match: 'users.*',
        icon: Users,
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
        name: 'Products',
        href: 'products.index',
        match: 'products.*',
        icon: Package,
        visible: ['owner'],
    },
];

export function AppSidebar() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const role = user?.role as RoleSlug | null | undefined;

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
                            render={<Link href={route('dashboard')} />}
                        >
                            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <ShoppingBasket className="size-4" />
                            </div>
                            <span className="font-semibold">Mini market</span>
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
