import UserForm from '@/Components/forms/UserForm';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { RoleOption, ShopUser } from '@/types';
import { Plus, Edit } from 'lucide-react';
import { useState } from 'react';

export type FormTable = 'users';

export type FormModalProps = {
    table: FormTable;
    type: 'create' | 'edit';
    data?: ShopUser | null;
    relatedData?: {
        roles?: RoleOption[];
    };
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

export default function FormModal({
    table,
    type,
    data,
    relatedData,
    open: openProp,
    onOpenChange,
}: FormModalProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const isControlled = openProp !== undefined;
    const open = isControlled ? openProp : uncontrolledOpen;
    const setOpen = (next: boolean) => {
        if (!isControlled) {
            setUncontrolledOpen(next);
        }
        onOpenChange?.(next);
    };
    const roles = relatedData?.roles ?? [];

    return (
        <>
            {!isControlled &&
                (type === 'create' ? (
                    <Button onClick={() => setOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Create {table.slice(0, -1)}
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setOpen(true)}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                ))}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {type === 'create' ? 'Create' : 'Edit'}{' '}
                            {table.slice(0, -1)}
                        </DialogTitle>
                        <DialogDescription>
                            {type === 'create'
                                ? 'Add a person who can log in to the shop.'
                                : 'Update this account.'}
                        </DialogDescription>
                    </DialogHeader>
                    {table === 'users' && (
                        <UserForm
                            type={type}
                            data={data}
                            roles={roles}
                            setOpen={setOpen}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
