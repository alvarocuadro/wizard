import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Box, Skeleton, Typography } from '@mui/material';
import { useDataTable } from '../../hooks/useDataTable';
import type { MRT_TableOptions } from 'material-react-table';

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: MRT_ColumnDef<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  enablePagination?: boolean;
  extraOptions?: Partial<MRT_TableOptions<T>>;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No hay datos para mostrar.',
  enablePagination = true,
  extraOptions,
}: DataTableProps<T>) {
  const { table } = useDataTable<T>({ data, columns, isLoading, enablePagination, extraOptions });

  if (isLoading) {
    return (
      <Box sx={{ display: 'grid', gap: 1 }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={44} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  if (!isLoading && data.length === 0) {
    return (
      <Box
        sx={{
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 5,
          p: 5,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return <MaterialReactTable table={table} />;
}
