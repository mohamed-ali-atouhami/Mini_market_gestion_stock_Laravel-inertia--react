import { Input } from '@/Components/ui/input';
import { KeyboardEvent, ComponentProps } from 'react';

type BarcodeInputProps = Omit<
    ComponentProps<typeof Input>,
    'value' | 'onChange' | 'onKeyDown'
> & {
    value: string;
    onChange: (value: string) => void;
};

export default function BarcodeInput({
    value,
    onChange,
    ...props
}: BarcodeInputProps) {
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        onChange(value.trim());
    };

    return (
        <Input
            inputMode="numeric"
            autoComplete="off"
            placeholder="Scan or type barcode"
            {...props}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
        />
    );
}
