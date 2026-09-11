import { Button } from '@/Components/ui/button';
import { ITEMS_PER_PAGE } from '@/lib/settings';
import { useT } from '@/lib/i18n';
import { updateQuery } from '@/lib/query';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageGroup(page: number, totalPages: number, size: number): number[] {
    if (totalPages < 1) {
        return [];
    }

    const groupSize = Math.min(size, totalPages);
    const start = Math.floor((page - 1) / groupSize) * groupSize + 1;
    const end = Math.min(start + groupSize - 1, totalPages);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function PageGroupButtons({
    pages,
    page,
    totalPages,
    groupSize,
    onPage,
    previousLabel,
    nextLabel,
}: {
    pages: number[];
    page: number;
    totalPages: number;
    groupSize: number;
    onPage: (nextPage: number) => void;
    previousLabel: string;
    nextLabel: string;
}) {
    const start = pages[0] ?? 1;
    const end = pages[pages.length - 1] ?? 1;

    return (
        <div className="flex items-center justify-end gap-1">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPage(Math.max(1, start - groupSize))}
                disabled={start <= 1}
            >
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                <span className="sr-only">{previousLabel}</span>
            </Button>
            {pages.map((number) => (
                <Button
                    key={number}
                    variant={page === number ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPage(number)}
                >
                    {number}
                </Button>
            ))}
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPage(Math.min(totalPages, end + 1))}
                disabled={end >= totalPages}
            >
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                <span className="sr-only">{nextLabel}</span>
            </Button>
        </div>
    );
}

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

    const previousLabel = t('Previous page');
    const nextLabel = t('Next page');

    return (
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 text-sm text-muted-foreground">
                {t('Showing :from to :to of :total results', {
                    from,
                    to,
                    total: totalCount,
                })}
            </div>
            <div className="sm:hidden">
                <PageGroupButtons
                    pages={pageGroup(page, totalPages, 3)}
                    page={page}
                    totalPages={totalPages}
                    groupSize={3}
                    onPage={handlePageClick}
                    previousLabel={previousLabel}
                    nextLabel={nextLabel}
                />
            </div>
            <div className="hidden sm:block">
                <PageGroupButtons
                    pages={pageGroup(page, totalPages, 7)}
                    page={page}
                    totalPages={totalPages}
                    groupSize={7}
                    onPage={handlePageClick}
                    previousLabel={previousLabel}
                    nextLabel={nextLabel}
                />
            </div>
        </div>
    );
}
