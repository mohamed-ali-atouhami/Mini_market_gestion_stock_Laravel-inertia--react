import { Search } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { updateQuery } from '@/lib/query';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/Components/ui/input';

function searchFromPageUrl(url: string): string {
    const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';

    return new URLSearchParams(query).get('search') ?? '';
}

export default function TableSearch({
    placeholder = 'Search...',
}: {
    placeholder?: string;
}) {
    const t = useT();
    const pageUrl = usePage().url;
    const urlSearch = searchFromPageUrl(pageUrl);
    const [value, setValue] = useState(urlSearch);
    const typingRef = useRef(false);

    useEffect(() => {
        if (typingRef.current) {
            return;
        }

        setValue(urlSearch);
    }, [urlSearch]);

    useEffect(() => {
        typingRef.current = true;
        const timeout = window.setTimeout(() => {
            const current =
                new URLSearchParams(window.location.search).get('search') ?? '';
            if (value !== current) {
                updateQuery({ search: value || null, page: '1' });
            }
            typingRef.current = false;
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [value]);

    return (
        <div className="flex w-full items-center gap-2 rounded-full px-2 text-xs ring-[1.5px] ring-border md:w-auto">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
                placeholder={t(placeholder)}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full border-none bg-transparent p-2 outline-none focus-visible:ring-0"
            />
        </div>
    );
}
