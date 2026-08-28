import { useT } from '@/lib/i18n';

export function StockCornerBadge({ kind }: { kind: 'low' | 'out' }) {
    const t = useT();
    const label = kind === 'out' ? t('out of stock') : t('Low stock');

    return (
        <span
            aria-label={label}
            className="pointer-events-none absolute top-0 right-0 z-10 h-[4.5rem] w-[5.5rem] overflow-hidden rtl:right-auto rtl:left-0"
        >
            <span className="absolute top-[0.85rem] -right-8 w-[7rem] rotate-45 bg-red-100 py-0.5 text-center text-[10px] font-semibold tracking-wide text-red-800 rtl:right-auto rtl:-left-8 rtl:-rotate-45">
                {label}
            </span>
        </span>
    );
}
