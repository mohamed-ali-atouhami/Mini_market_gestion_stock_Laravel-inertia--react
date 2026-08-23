import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';

export default function Index({
    settings,
}: {
    settings: {
        shop_name: string;
        shop_phone: string | null;
        shop_address: string | null;
        currency: string;
        ticket_footer: string | null;
        low_stock_enabled: boolean;
    };
}) {
    const form = useForm({
        shop_name: settings.shop_name,
        shop_phone: settings.shop_phone ?? '',
        shop_address: settings.shop_address ?? '',
        currency: settings.currency,
        ticket_footer: settings.ticket_footer ?? '',
        low_stock_enabled: settings.low_stock_enabled,
    });

    return (
        <AuthenticatedLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="mt-1 text-muted-foreground">
                        Shop name on the receipt and sidebar. Low stock turns
                        the red warning on or off.
                    </p>
                </div>

                <form
                    className="max-w-xl space-y-4 rounded-md bg-card p-4 ring-1 ring-foreground/10"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.patch(route('settings.update'));
                    }}
                >
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="shop_name">
                                Shop name
                            </FieldLabel>
                            <Input
                                id="shop_name"
                                value={form.data.shop_name}
                                onChange={(e) =>
                                    form.setData('shop_name', e.target.value)
                                }
                                required
                            />
                            <FieldError>{form.errors.shop_name}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="shop_phone">Phone</FieldLabel>
                            <Input
                                id="shop_phone"
                                value={form.data.shop_phone}
                                onChange={(e) =>
                                    form.setData('shop_phone', e.target.value)
                                }
                            />
                            <FieldError>{form.errors.shop_phone}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="shop_address">
                                Address
                            </FieldLabel>
                            <Input
                                id="shop_address"
                                value={form.data.shop_address}
                                onChange={(e) =>
                                    form.setData(
                                        'shop_address',
                                        e.target.value,
                                    )
                                }
                            />
                            <FieldError>{form.errors.shop_address}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="currency">Currency</FieldLabel>
                            <Input
                                id="currency"
                                value={form.data.currency}
                                onChange={(e) =>
                                    form.setData('currency', e.target.value)
                                }
                                required
                            />
                            <FieldError>{form.errors.currency}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="ticket_footer">
                                Ticket footer
                            </FieldLabel>
                            <Input
                                id="ticket_footer"
                                value={form.data.ticket_footer}
                                onChange={(e) =>
                                    form.setData(
                                        'ticket_footer',
                                        e.target.value,
                                    )
                                }
                            />
                            <FieldError>{form.errors.ticket_footer}</FieldError>
                        </Field>
                        <Field orientation="horizontal">
                            <Checkbox
                                id="low_stock_enabled"
                                checked={form.data.low_stock_enabled}
                                onCheckedChange={(checked) =>
                                    form.setData(
                                        'low_stock_enabled',
                                        checked === true,
                                    )
                                }
                            />
                            <FieldLabel
                                htmlFor="low_stock_enabled"
                                className="font-normal"
                            >
                                Highlight low stock
                            </FieldLabel>
                        </Field>
                    </FieldGroup>
                    <Button type="submit" disabled={form.processing}>
                        Save
                    </Button>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
