import FlashToasts from '@/Components/FlashToasts';
import { LanguageSwitcher } from '@/Components/layout/LanguageSwitcher';
import { Card, CardContent } from '@/Components/ui/card';
import { PropsWithChildren } from 'react';

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-muted pt-6 sm:justify-center sm:pt-0">
            <FlashToasts />
            <div className="flex w-full max-w-md justify-end px-4 sm:px-0">
                <LanguageSwitcher />
            </div>
            <Card className="mt-6 w-full sm:max-w-md">
                <CardContent>{children}</CardContent>
            </Card>
        </div>
    );
}
