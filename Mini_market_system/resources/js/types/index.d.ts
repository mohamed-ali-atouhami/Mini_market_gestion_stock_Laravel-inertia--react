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

export type CategoryOption = {
    id: number;
    name: string;
};

export type ShopCategory = {
    id: number;
    name: string;
    is_active: boolean;
};

export type ShopSupplier = {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
};

export type ShopProduct = {
    id: number;
    name: string;
    barcode: string | null;
    category: string | null;
    category_id: number;
    cost_price: string;
    sale_price: string;
    stock_quantity: string;
    min_stock: string;
    unit: string;
    is_active: boolean;
    is_low_stock: boolean;
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
    flash: {
        status: string | null;
        created_product: ScannedProduct | null;
    };
};

export type ScannedProduct = {
    id: number;
    name: string;
    barcode: string | null;
    cost_price: string;
    unit: string;
    is_active: boolean;
};

export type PurchaseLine = {
    product_id: number;
    name: string;
    barcode: string | null;
    quantity: string;
    unit_cost: string;
};

export type ShopPurchase = {
    id: number;
    reference: string;
    supplier: string | null;
    supplier_id?: number;
    purchase_date: string | null;
    status: 'draft' | 'received' | 'cancelled';
    total: string;
    invoice_number: string | null;
    notes?: string | null;
    items?: PurchaseLine[];
};
