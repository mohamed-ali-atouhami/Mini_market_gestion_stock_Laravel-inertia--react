import { DirectionProvider } from '@/Components/ui/direction';
import { useLocale } from '@/lib/i18n';
import { ReactNode, useEffect } from 'react';

export function ApplyLocale({ children }: { children: ReactNode }) {
    const locale = useLocale();
    const direction = locale === 'ar' ? 'rtl' : 'ltr';

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = direction;
    }, [locale, direction]);

    return (
        <DirectionProvider direction={direction}>{children}</DirectionProvider>
    );
}
