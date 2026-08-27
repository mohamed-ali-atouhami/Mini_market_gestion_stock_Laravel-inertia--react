import { useT } from '@/lib/i18n';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export default function FlashToasts() {
    const { flash } = usePage<PageProps>().props;
    const t = useT();
    const status = flash?.status;
    const error = flash?.error;
    const shownKey = useRef<string | null>(null);

    useEffect(() => {
        const key = `${status ?? ''}|${error ?? ''}`;

        if (key === '|') {
            shownKey.current = null;
            return;
        }

        if (shownKey.current === key) {
            return;
        }

        shownKey.current = key;

        if (error) {
            toast.error(t(error));
        }

        if (!status || status === 'verification-link-sent') {
            return;
        }

        toast.success(t(status));
    }, [status, error, t]);

    return null;
}
