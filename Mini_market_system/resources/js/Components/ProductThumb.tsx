import { cn } from '@/lib/utils';

export function ProductThumb({
    src,
    name,
    className,
}: {
    src: string | null | undefined;
    name: string | null | undefined;
    className?: string;
}) {
    if (src) {
        return (
            <img
                src={src}
                alt=""
                className={cn(
                    'size-10 shrink-0 rounded-md object-cover',
                    className,
                )}
            />
        );
    }

    return (
        <div
            className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground',
                className,
            )}
        >
            {(name ?? '').trim().slice(0, 1).toUpperCase() || '?'}
        </div>
    );
}

export function ProductNameCell({
    src,
    name,
    className,
    thumbClassName,
}: {
    src: string | null | undefined;
    name: string | null | undefined;
    className?: string;
    thumbClassName?: string;
}) {
    return (
        <div className={cn('flex items-center gap-3', className)}>
            <ProductThumb src={src} name={name} className={thumbClassName} />
            <span className="font-medium">{name || '—'}</span>
        </div>
    );
}
