import { useMemo } from 'react';
import {
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_TableOptions,
} from 'material-react-table';
import { MRT_Localization_ES } from 'material-react-table/locales/es';

// Sort DD/MM/AAAA dates correctly
function sortDateDDMMYYYY(a: string, b: string): number {
  const parse = (s: string) => {
    const [d, m, y] = s.split('/').map(Number);
    return new Date(y, m - 1, d).getTime();
  };
  const ta = parse(a);
  const tb = parse(b);
  if (isNaN(ta) && isNaN(tb)) return 0;
  if (isNaN(ta)) return 1;
  if (isNaN(tb)) return -1;
  return ta - tb;
}

export interface UseDataTableOptions<T extends Record<string, unknown>> {
  data: T[];
  columns: MRT_ColumnDef<T>[];
  isLoading?: boolean;
  enablePagination?: boolean;
  extraOptions?: Partial<MRT_TableOptions<T>>;
}

export function useDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  isLoading = false,
  enablePagination = true,
  extraOptions = {},
}: UseDataTableOptions<T>) {
  const processedColumns = useMemo<MRT_ColumnDef<T>[]>(
    () =>
      columns.map((col) => ({
        filterFn: 'includesString' as const,
        enableColumnFilter: true,
        enableSorting: true,
        ...col,
      })),
    [columns]
  );

  const table = useMaterialReactTable<T>({
    data,
    columns: processedColumns,
    state: { isLoading },
    // Search: contains (not fuzzy)
    globalFilterFn: 'includesString',
    filterFns: {
      includesString: (row, columnId, filterValue: string) => {
        const cellValue = String(row.getValue(columnId) ?? '');
        return cellValue.toLowerCase().includes(filterValue.toLowerCase());
      },
    },
    // Sorting: numbers are numeric, dates are DD/MM/AAAA
    sortingFns: {
      dateDDMMYYYY: (rowA, rowB, columnId) => {
        return sortDateDDMMYYYY(
          String(rowA.getValue(columnId) ?? ''),
          String(rowB.getValue(columnId) ?? '')
        );
      },
    },
    enablePagination,
    enableGlobalFilter: true,
    enableColumnFilters: true,
    enableSorting: true,
    muiToolbarAlertBannerProps: isLoading
      ? { color: 'info', children: 'Cargando datos...' }
      : undefined,
    muiTableContainerProps: { sx: { maxHeight: '60vh' } },
    localization: MRT_Localization_ES,
    ...extraOptions,
  });

  return { table };
}
