import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Strip trailing zeros so 6.000 is "6" in number inputs (avoids 6000 in some locales). */
export function formatInputNumber(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const amount = Number(value);

    return Number.isNaN(amount) ? String(value) : String(amount);
}

export function formatMoney(
    value: string | number | null | undefined,
    currency = 'MAD',
): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    const amount = Number(value);

    return Number.isNaN(amount)
        ? String(value)
        : `${amount.toFixed(2)} ${currency}`;
}
