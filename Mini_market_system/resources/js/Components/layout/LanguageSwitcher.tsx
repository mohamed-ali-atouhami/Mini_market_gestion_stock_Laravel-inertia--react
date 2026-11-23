import { AppLocale, useLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';

const languages: { locale: AppLocale; label: string }[] = [
    { locale: 'en', label: 'EN' },
    { locale: 'fr', label: 'FR' },
    { locale: 'es', label: 'ES' },
    { locale: 'ar', label: 'عربي' },
];

export function LanguageSwitcher({ className }: { className?: string }) {
    const locale = useLocale();

    const switchTo = (next: AppLocale) => {
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
            {languages.map((language) => (
                <button
                    key={language.locale}
                    type="button"
                    className={cn(
                        'rounded px-2 py-1 transition-colors',
                        locale === language.locale
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => switchTo(language.locale)}
                >
                    {language.label}
                </button>
            ))}
        </div>
    );
}
