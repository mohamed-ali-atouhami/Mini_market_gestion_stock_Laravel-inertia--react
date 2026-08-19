import { Search } from 'lucide-react';
import { updateQuery } from '@/lib/query';
import { useEffect, useState } from 'react';
import { Input } from '@/Components/ui/input';

export default function TableSearch({
    placeholder = 'Search...',
}: {
    placeholder?: string;
}) {
    const initial =
        typeof window === 'undefined'
            ? ''
            : new URLSearchParams(window.location.search).get('search') ?? '';
    const [value, setValue] = useState(initial);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            const current =
                new URLSearchParams(window.location.search).get('search') ?? '';
            if (value === current) {
                return;
            }
            updateQuery({ search: value || null, page: '1' });
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [value]);

    return (
        <div className="flex w-full items-center gap-2 rounded-full px-2 text-xs ring-[1.5px] ring-border md:w-auto">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full border-none bg-transparent p-2 outline-none focus-visible:ring-0"
            />
        </div>
    );
}
