type TillProduct = {
    name: string;
    barcode: string | null;
    stock_quantity: string;
    first_on_till?: boolean;
};

function tillGroup(product: TillProduct): number {
    if (product.first_on_till) {
        return 0;
    }

    if (product.barcode) {
        return 2;
    }

    return 1;
}

export function compareAllTillProducts(a: TillProduct, b: TillProduct): number {
    const group = tillGroup(a) - tillGroup(b);

    if (group !== 0) {
        return group;
    }

    const aOut = Number(a.stock_quantity) <= 0;
    const bOut = Number(b.stock_quantity) <= 0;

    if (aOut !== bOut) {
        return aOut ? 1 : -1;
    }

    return a.name.localeCompare(b.name);
}

export function compareByName(a: { name: string }, b: { name: string }): number {
    return a.name.localeCompare(b.name);
}
