import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function InputError({
    message,
    className = '',
}: {
    message?: string;
    className?: string;
}) {
    const t = useT();

    if (!message) {
        return null;
    }

    return (
        <p className={cn('text-sm text-destructive', className)}>{t(message)}</p>
    );
}
