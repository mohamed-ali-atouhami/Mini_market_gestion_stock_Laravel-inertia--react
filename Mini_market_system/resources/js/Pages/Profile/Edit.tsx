import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ status }: { status?: string }) {
    return (
        <AuthenticatedLayout header="Profile">
            <Head title="Profile" />

            {status && (
                <p className="text-sm font-medium text-green-600">{status}</p>
            )}

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
