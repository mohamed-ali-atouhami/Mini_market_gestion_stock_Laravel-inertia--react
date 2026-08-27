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
    image_url: string | null;
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
    shop: {
        name: string;
        currency: string;
        low_stock_enabled: boolean;
    };
    locale: 'en' | 'ar';
    flash: {
        status: string | null;
        error: string | null;
        created_product: ScannedProduct | null;
    };
    cashSession: {
        id: number;
        opened_at: string | null;
    } | null;
};

export type ScannedProduct = {
    id: number;
    name: string;
    barcode: string | null;
    cost_price: string;
    unit: string;
    is_active: boolean;
    image_url?: string | null;
};

export type PurchaseLine = {
    product_id: number;
    name: string;
    barcode: string | null;
    quantity: string;
    unit_cost: string;
    image_url?: string | null;
};

export type PosProduct = {
    id: number;
    name: string;
    barcode: string | null;
    category_id: number;
    sale_price: string;
    stock_quantity: string;
    min_stock: string;
    unit: string;
    is_active: boolean;
    is_low_stock: boolean;
    image_url: string | null;
};

export type CartLine = {
    product_id: number;
    name: string;
    barcode: string | null;
    quantity: string;
    unit_price: string;
    unit?: string;
    stock_quantity?: string;
    image_url?: string | null;
};

export type PosCustomer = {
    id: number;
    name: string;
    phone: string;
};

export type ShopCredit = {
    id: number;
    reference: string;
    customer: string;
    phone: string | null;
    cashier: string | null;
    total: string;
    paid_at_sale: string;
    remaining: string;
    due_date: string | null;
    due_date_iso: string | null;
    is_overdue: boolean;
    whatsapp_url: string | null;
};

export type ShopSale = {
    id: number;
    reference: string;
    cashier: string | null;
    status: 'completed' | 'cancelled';
    total: string;
    amount_paid: string;
    change_amount: string;
    sold_at: string | null;
    payment_method?: 'cash' | 'credit';
    customer?: string | null;
    customer_phone?: string | null;
    due_date?: string | null;
    remaining?: string;
    paid_so_far?: string;
    items?: CartLine[];
};

export type ShopCashSession = {
    id: number;
    status: 'open' | 'closed';
    opened_at: string | null;
    closed_at: string | null;
    opening_amount: string;
    closing_amount: string | null;
    expected_amount: string | null;
    difference: string | null;
    sales_total?: string;
};

export type ShopStockProduct = {
    id: number;
    name: string;
    barcode: string | null;
    stock_quantity: string;
    min_stock: string;
    is_low_stock: boolean;
    image_url: string | null;
};

export type ShopStockMovement = {
    id: number;
    product?: string | null;
    image_url?: string | null;
    type: string;
    direction: string;
    quantity: string;
    quantity_before?: string;
    quantity_after?: string;
    reason: string;
    user: string | null;
    created_at: string | null;
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
