import { Badge } from '@/Components/ui/badge';
import { Button, buttonVariants } from '@/Components/ui/button';
import {
    Field,
    FieldError,
    FieldLabel,
} from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { cn } from '@/lib/utils';
import { ShopCredit } from '@/types';
import { useForm } from '@inertiajs/react';
import { SendIcon } from 'lucide-react';
import { FormEvent } from 'react';
import { toast } from 'sonner';

export default function Index({ credits }: { credits: ShopCredit[] }) {
    return (
        <>
            <div className="space-y-6">
                <p className="text-muted-foreground">
                    Customers who took goods now and will pay later. Anyone on
                    shift can collect.
                </p>

                <div className="rounded-md bg-card p-4 ring-1 ring-foreground/10">
                    {credits.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No open credit.
                        </p>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="hidden md:table-cell">
                                            Ticket
                                        </TableHead>
                                        <TableHead>Remaining</TableHead>
                                        <TableHead>Due</TableHead>
                                        <TableHead className="hidden md:table-cell">
                                            Opened by
                                        </TableHead>
                                        <TableHead>Collect</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {credits.map((credit) => (
                                        <TableRow key={credit.id}>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {credit.customer}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {credit.phone ?? '—'}
                                                </div>
                                                {credit.whatsapp_url ? (
                                                    <a
                                                        href={
                                                            credit.whatsapp_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={cn(
                                                            buttonVariants({
                                                                variant: 'link',
                                                                className:'text-green-500 hover:text-green-600 text-xs'
                                                            }),
                                                            'h-auto px-0',
                                                        )}
                                                    >
                                                        WhatsApp
                                                        <SendIcon className="size-3" />
                                                    </a>
                                                ) : null}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {credit.reference}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {credit.remaining} MAD
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span>
                                                        {credit.due_date ??
                                                            '—'}
                                                    </span>
                                                    {credit.is_overdue ? (
                                                        <Badge variant="destructive">
                                                            Overdue
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {credit.cashier ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <CollectForm
                                                    saleId={credit.id}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function CollectForm({ saleId }: { saleId: number }) {
    const form = useForm(`credit-${saleId}`, { amount: '' });
    const errors = form.errors as typeof form.errors & {
        cash_session?: string;
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(route('credits.pay', saleId), {
            preserveScroll: true,
            errorBag: `credit-${saleId}`,
            onError: (bag) => {
                const extra = bag as typeof bag & { cash_session?: string };
                const message = extra.amount ?? extra.cash_session;

                if (typeof message === 'string' && message !== '') {
                    toast.error(message);
                }
            },
        });
    };

    return (
        <form className="flex flex-wrap items-end gap-2" onSubmit={submit}>
            <Field className="w-28">
                <FieldLabel htmlFor={`amount-${saleId}`} className="sr-only">
                    Amount
                </FieldLabel>
                <Input
                    id={`amount-${saleId}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="MAD"
                    value={form.data.amount}
                    onChange={(e) => form.setData('amount', e.target.value)}
                />
            </Field>
            <Button type="submit" size="sm" disabled={form.processing}>
                Take
            </Button>
            <FieldError>
                {errors.amount ?? errors.cash_session}
            </FieldError>
        </form>
    );
}
