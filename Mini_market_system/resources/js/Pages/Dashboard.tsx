import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout header="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="mt-1 text-muted-foreground">
                        You are logged in.
                    </p>
                </div>
                <div className="rounded-xl bg-card p-6 text-card-foreground shadow-sm ring-1 ring-foreground/10">
                    Sales numbers will appear here in a later milestone.
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
