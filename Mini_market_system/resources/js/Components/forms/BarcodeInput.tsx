import { Input } from '@/Components/ui/input';
import { KeyboardEvent, ComponentProps, forwardRef } from 'react';

type BarcodeInputProps = Omit<
    ComponentProps<typeof Input>,
    'value' | 'onChange' | 'onKeyDown'
> & {
    value: string;
    onChange: (value: string) => void;
    onScan?: (value: string) => void;
};

const BarcodeInput = forwardRef<HTMLInputElement, BarcodeInputProps>(
    function BarcodeInput({ value, onChange, onScan, ...props }, ref) {
        const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key !== 'Enter') {
                return;
            }

            event.preventDefault();
            const next = value.trim();
            onChange(next);
            onScan?.(next);
        };

        return (
            <Input
                ref={ref}
                inputMode="numeric"
                autoComplete="off"
                placeholder="Scan or type barcode"
                {...props}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={handleKeyDown}
            />
        );
    },
);

export default BarcodeInput;
