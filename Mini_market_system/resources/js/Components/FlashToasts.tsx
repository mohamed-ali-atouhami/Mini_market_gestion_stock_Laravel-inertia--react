import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function FlashToasts() {
    const { flash } = usePage<PageProps>().props;
    const status = flash?.status;
    const error = flash?.error;

    useEffect(() => {
        if (error) {
            toast.error(error);
        }

        if (!status || status === 'verification-link-sent') {
            return;
        }

        toast.success(status);
    }, [flash, status, error]);

    return null;
}
