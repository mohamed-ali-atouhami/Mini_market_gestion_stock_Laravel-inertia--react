export interface User {
    id: number;
    name: string;
    username: string;
    role: 'owner' | 'cashier' | null;
    is_active: boolean;
}

export type RoleOption = {
    id: number;
    name: string;
};

export type ShopUser = {
    id: number;
    name: string;
    username: string;
    role: string | null;
    role_id: number;
    is_active: boolean;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
    };
    can: {
        manageUsers: boolean;
        changePrices: boolean;
        receivePurchases: boolean;
        deleteProducts: boolean;
    };
};
