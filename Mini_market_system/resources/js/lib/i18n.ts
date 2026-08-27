import ar from '@/lang/ar.json';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { useCallback } from 'react';

export type AppLocale = 'en' | 'ar';

type Replacements = Record<string, string | number>;

const arabic = ar as Record<string, string>;

function interpolatedKey(key: string): { template: string; replace: Replacements } | null {
    const stock = /^Not enough stock for (.+)\.$/.exec(key);
    if (stock) {
        return { template: 'Not enough stock for :name.', replace: { name: stock[1] } };
    }

    const disabledSold = /^(.+) is disabled and cannot be sold\.$/.exec(key);
    if (disabledSold) {
        return {
            template: ':name is disabled and cannot be sold.',
            replace: { name: disabledSold[1] },
        };
    }

    const disabledReceived = /^(.+) is disabled and cannot be received\.$/.exec(key);
    if (disabledReceived) {
        return {
            template: ':name is disabled and cannot be received.',
            replace: { name: disabledReceived[1] },
        };
    }

    const remaining = /^That is more than the remaining (.+) MAD\.$/.exec(key);
    if (remaining) {
        return {
            template: 'That is more than the remaining :amount MAD.',
            replace: { amount: remaining[1] },
        };
    }

    return null;
}

export function translate(
    locale: AppLocale,
    key: string,
    replace?: Replacements,
): string {
    const interpolated = replace ? null : interpolatedKey(key);

    if (interpolated) {
        return translate(locale, interpolated.template, interpolated.replace);
    }

    let text = locale === 'ar' ? (arabic[key] ?? key) : key;

    if (replace) {
        const names = Object.keys(replace).sort((a, b) => b.length - a.length);

        for (const name of names) {
            text = text.replaceAll(`:${name}`, String(replace[name]));
        }
    }

    return text;
}

export function useLocale(): AppLocale {
    return usePage<PageProps>().props.locale ?? 'en';
}

export function useT() {
    const locale = useLocale();

    return useCallback(
        (key: string, replace?: Replacements) =>
            translate(locale, key, replace),
        [locale],
    );
}
