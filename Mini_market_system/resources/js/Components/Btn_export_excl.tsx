import { buttonVariants } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { Download } from 'lucide-react';

export type BtnExportExclParams = Record<
    string,
    string | number | boolean | null | undefined
>;

type BtnExportExclProps = {
    href: string;
    label: string;
    params?: BtnExportExclParams;
    className?: string;
};

function exportUrl(href: string, params: BtnExportExclParams): string {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (
            value === null ||
            value === undefined ||
            value === '' ||
            value === 'ALL'
        ) {
            return;
        }

        search.set(key, String(value));
    });

    const query = search.toString();

    return query === '' ? href : `${href}${href.includes('?') ? '&' : '?'}${query}`;
}

export default function BtnExportExcl({
    href,
    label,
    params = {},
    className,
}: BtnExportExclProps) {
    return (
        <a
            href={exportUrl(href, params)}
            className={cn(buttonVariants({ variant: 'outline' }), className)}
        >
            <Download />
            {label}
        </a>
    );
}
