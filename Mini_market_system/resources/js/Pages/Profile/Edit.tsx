import { useT } from '@/lib/i18n';
import { Head } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit() {
    const t = useT();

    return (
        <>
            <Head title={t('Profile')} />

            <div className="space-y-6">
                <div className="max-w-xl rounded-xl bg-card p-6 shadow-sm ring-1 ring-foreground/10 sm:p-8">
                    <UpdateProfileInformationForm />
                </div>
                <div className="max-w-xl rounded-xl bg-card p-6 shadow-sm ring-1 ring-foreground/10 sm:p-8">
                    <UpdatePasswordForm />
                </div>
            </div>
        </>
    );
}
