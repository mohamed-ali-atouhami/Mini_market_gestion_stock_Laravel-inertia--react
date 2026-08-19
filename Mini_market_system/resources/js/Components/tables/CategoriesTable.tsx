import Table, { TableColumn } from '@/Components/tables/Table';
import { RowActions } from '@/Components/tables/RowActions';
import { Badge } from '@/Components/ui/badge';
import { TableCell, TableRow } from '@/Components/ui/table';
import { ShopCategory } from '@/types';

export function CategoriesTable({
    categories,
    columns,
}: {
    categories: ShopCategory[];
    columns: TableColumn[];
}) {
    const renderRow = (category: ShopCategory) => {
        return (
            <TableRow key={category.id}>
                <TableCell>
                    <div className="font-medium">{category.name}</div>
                </TableCell>
                <TableCell>
                    <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                </TableCell>
                <TableCell>
                    <RowActions table="categories" data={category} />
                </TableCell>
            </TableRow>
        );
    };

    return <Table columns={columns} renderRow={renderRow} data={categories} />;
}
