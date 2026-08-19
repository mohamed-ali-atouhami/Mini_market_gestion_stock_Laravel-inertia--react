import { router } from '@inertiajs/react';

export function updateQuery(updates: Record<string, string | null>) {
    const params = new URLSearchParams(window.location.search);

    Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'ALL') {
            params.delete(key);
        } else {
            params.set(key, value);
        }
    });

    router.get(
        window.location.pathname,
        Object.fromEntries(params),
        {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        },
    );
}
