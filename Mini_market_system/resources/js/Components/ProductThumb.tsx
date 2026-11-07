import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

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
    enlarge = false,
}: {
    src: string | null | undefined;
    name: string | null | undefined;
    className?: string;
    thumbClassName?: string;
    enlarge?: boolean;
}) {
    const thumb = (
        <ProductThumb src={src} name={name} className={thumbClassName} />
    );

    return (
        <div className={cn('flex min-w-0 items-center gap-3', className)}>
            {enlarge && src ? (
                <Dialog>
                    <DialogTrigger
                        className="shrink-0 cursor-pointer rounded-md outline-none focus-visible:ring-2"
                        aria-label={name || undefined}
                    >
                        {thumb}
                    </DialogTrigger>
                    <DialogContent
                        showCloseButton={false}
                        className="w-fit max-w-[92vw] border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-[92vw]"
                    >
                        <DialogTitle className="sr-only">
                            {name || 'Image'}
                        </DialogTitle>
                        <div className="relative">
                            <img
                                src={src}
                                alt={name || ''}
                                className="max-h-[85vh] max-w-[92vw] rounded-md object-contain"
                            />
                            <DialogClose className="absolute top-2 end-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black">
                                <X className="size-4" />
                                <span className="sr-only">Close</span>
                            </DialogClose>
                        </div>
                    </DialogContent>
                </Dialog>
            ) : (
                thumb
            )}
            <span className="min-w-0 font-medium break-words">{name || '—'}</span>
        </div>
    );
}
