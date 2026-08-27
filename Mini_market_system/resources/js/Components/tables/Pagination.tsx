import { Button } from '@/Components/ui/button';
import { ITEMS_PER_PAGE } from '@/lib/settings';
import { useT } from '@/lib/i18n';
import { updateQuery } from '@/lib/query';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
    page,
    totalCount,
}: {
    page: number;
    totalCount: number;
}) {
    const t = useT();
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const from = (page - 1) * ITEMS_PER_PAGE + 1;
    const to = Math.min(page * ITEMS_PER_PAGE, totalCount);

    const handlePageClick = (nextPage: number) => {
        updateQuery({ page: String(nextPage) });
    };

    if (totalCount === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 text-sm text-muted-foreground">
                {t('Showing :from to :to of :total results', {
                    from,
                    to,
                    total: totalCount,
                })}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageClick(page - 1)}
                    disabled={page === 1}
                >
                    <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                    <span className="sr-only">{t('Previous page')}</span>
                </Button>
                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <Button
                            key={i}
                            variant={page === i + 1 ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePageClick(i + 1)}
                        >
                            {i + 1}
                        </Button>
                    ))}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageClick(page + 1)}
                    disabled={page === totalPages || totalPages === 0}
                >
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                    <span className="sr-only">{t('Next page')}</span>
                </Button>
            </div>
        </div>
    );
}
