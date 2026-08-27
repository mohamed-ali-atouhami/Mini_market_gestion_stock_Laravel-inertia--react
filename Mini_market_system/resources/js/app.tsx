import '../css/app.css';
import './bootstrap';

import { ApplyLocale } from '@/Components/layout/ApplyLocale';
import { Toaster } from '@/Components/ui/sonner';
import { TooltipProvider } from '@/Components/ui/tooltip';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Mini_market_system';

type InertiaPageModule = {
    default: {
        layout?: (page: ReactNode) => ReactNode;
        __localeWrapped?: boolean;
    };
};

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name) => {
        const page = (await resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        )) as InertiaPageModule;

        if (!name.startsWith('Auth/')) {
            page.default.layout ??= (component) => (
                <AuthenticatedLayout>{component}</AuthenticatedLayout>
            );
        }

        if (!page.default.__localeWrapped) {
            const pageLayout = page.default.layout;
            page.default.layout = (component) => (
                <ApplyLocale>
                    <TooltipProvider>
                        {pageLayout ? pageLayout(component) : component}
                        <Toaster />
                    </TooltipProvider>
                </ApplyLocale>
            );
            page.default.__localeWrapped = true;
        }

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
