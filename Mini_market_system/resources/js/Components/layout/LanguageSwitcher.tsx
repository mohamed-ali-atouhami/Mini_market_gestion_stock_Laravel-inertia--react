import { useLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';

export function LanguageSwitcher({ className }: { className?: string }) {
    const locale = useLocale();

    const switchTo = (next: 'en' | 'ar') => {
        if (next === locale) {
            return;
        }

        router.post(
            route('locale.update'),
            { locale: next },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-md border p-0.5 text-xs font-medium',
                className,
            )}
        >
            <button
                type="button"
                className={cn(
                    'rounded px-2 py-1 transition-colors',
                    locale === 'en'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => switchTo('en')}
            >
                EN
            </button>
            <button
                type="button"
                className={cn(
                    'rounded px-2 py-1 transition-colors',
                    locale === 'ar'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => switchTo('ar')}
            >
                عربي
            </button>
        </div>
    );
}
