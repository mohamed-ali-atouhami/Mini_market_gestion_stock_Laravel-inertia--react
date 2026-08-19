import {
    Table as ShadcnTable,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/Components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { updateQuery } from '@/lib/query';
import { ArrowUpDown, ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import { ReactNode } from 'react';

type ColumnFilter = {
    type: 'select';
    options: { value: string; label: string }[];
    defaultValue?: string;
    paramKey?: string;
};

export type TableColumn = {
    header: string;
    accessor: string;
    className?: string;
    filter?: ColumnFilter;
    sortable?: boolean;
};

export default function Table<T>({
    columns,
    renderRow,
    data,
}: {
    columns: TableColumn[];
    renderRow: (row: T) => ReactNode;
    data: T[];
}) {
    const searchParams = new URLSearchParams(window.location.search);

    const handleFilterChange = (paramKey: string, value: string) => {
        updateQuery({ [paramKey]: value, page: '1' });
    };

    const handleSort = (accessor: string, order: 'asc' | 'desc') => {
        updateQuery({ sort: accessor, order, page: '1' });
    };

    const getCurrentSort = (accessor: string) => {
        const sort = searchParams.get('sort');
        const order = searchParams.get('order');
        if (sort === accessor) {
            return order === 'desc' ? 'desc' : 'asc';
        }
        return null;
    };

    return (
        <div className="rounded-md border">
            <ShadcnTable>
                <TableHeader>
                    <TableRow>
                        {columns.map((column, index) => {
                            const currentSort = column.sortable
                                ? getCurrentSort(column.accessor)
                                : null;
                            const hasFilter = !!column.filter;
                            const hasSort = !!column.sortable;
                            const isFirstColumn = index === 0;
                            const isClickable = hasFilter || hasSort;

                            return (
                                <TableHead
                                    key={column.accessor}
                                    className={`${column.className || ''} ${isFirstColumn && isClickable ? 'pl-4' : ''}`}
                                >
                                    {hasFilter || hasSort ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                render={
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 -ml-3 data-popup-open:bg-accent"
                                                    />
                                                }
                                            >
                                                <span>{column.header}</span>
                                                {currentSort === 'asc' ? (
                                                    <ArrowUp className="ml-2 h-4 w-4" />
                                                ) : currentSort === 'desc' ? (
                                                    <ArrowDown className="ml-2 h-4 w-4" />
                                                ) : (
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                )}
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                {hasSort && (
                                                    <>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleSort(
                                                                    column.accessor,
                                                                    'asc',
                                                                )
                                                            }
                                                        >
                                                            <ArrowUp className="h-4 w-4" />
                                                            Asc
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleSort(
                                                                    column.accessor,
                                                                    'desc',
                                                                )
                                                            }
                                                        >
                                                            <ArrowDown className="h-4 w-4" />
                                                            Desc
                                                        </DropdownMenuItem>
                                                        {currentSort && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    updateQuery(
                                                                        {
                                                                            sort: null,
                                                                            order: null,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <X className="h-4 w-4" />
                                                                Clear
                                                            </DropdownMenuItem>
                                                        )}
                                                    </>
                                                )}
                                                {hasFilter && hasSort && (
                                                    <DropdownMenuSeparator />
                                                )}
                                                {hasFilter &&
                                                    column.filter!.options.map(
                                                        (option) => {
                                                            const currentValue =
                                                                searchParams.get(
                                                                    column
                                                                        .filter!
                                                                        .paramKey ||
                                                                        column.accessor,
                                                                ) ||
                                                                column.filter!
                                                                    .defaultValue ||
                                                                'ALL';
                                                            const isSelected =
                                                                currentValue ===
                                                                option.value;
                                                            return (
                                                                <DropdownMenuItem
                                                                    key={
                                                                        option.value
                                                                    }
                                                                    onClick={() =>
                                                                        handleFilterChange(
                                                                            column
                                                                                .filter!
                                                                                .paramKey ||
                                                                                column.accessor,
                                                                            option.value,
                                                                        )
                                                                    }
                                                                    className={
                                                                        isSelected
                                                                            ? 'bg-accent'
                                                                            : ''
                                                                    }
                                                                >
                                                                    {isSelected ? (
                                                                        <Check className="mr-2 h-4 w-4" />
                                                                    ) : (
                                                                        <span className="mr-2 h-4 w-4" />
                                                                    )}
                                                                    {
                                                                        option.label
                                                                    }
                                                                </DropdownMenuItem>
                                                            );
                                                        },
                                                    )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <span>{column.header}</span>
                                    )}
                                </TableHead>
                            );
                        })}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((row) => renderRow(row))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </ShadcnTable>
        </div>
    );
}
