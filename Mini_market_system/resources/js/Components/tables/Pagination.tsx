import { Button } from '@/Components/ui/button';
import { ITEMS_PER_PAGE } from '@/lib/settings';
import { updateQuery } from '@/lib/query';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
    page,
    totalCount,
}: {
    page: number;
    totalCount: number;
}) {
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const handlePageClick = (nextPage: number) => {
        updateQuery({ page: String(nextPage) });
    };

    if (totalCount === 0) {
        return null;
    }

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount}{' '}
                results
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageClick(page - 1)}
                    disabled={page === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous page</span>
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
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                </Button>
            </div>
        </div>
    );
}
