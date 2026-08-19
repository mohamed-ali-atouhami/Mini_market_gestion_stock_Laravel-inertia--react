import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit() {
    return (
        <AuthenticatedLayout header="Profile">
            <Head title="Profile" />

            <div className="space-y-6">
                <div className="max-w-xl rounded-xl bg-card p-6 shadow-sm ring-1 ring-foreground/10 sm:p-8">
                    <UpdateProfileInformationForm />
                </div>
                <div className="max-w-xl rounded-xl bg-card p-6 shadow-sm ring-1 ring-foreground/10 sm:p-8">
                    <UpdatePasswordForm />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
