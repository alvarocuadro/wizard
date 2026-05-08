import * as XLSX from 'xlsx';
import type { CellValue } from './types';

const cache = new Map<string, XLSX.WorkBook>();

export function cacheWorkbook(fileName: string, wb: XLSX.WorkBook): void {
  cache.set(fileName, wb);
}

export function getSheetNames(fileName: string): string[] {
  return cache.get(fileName)?.SheetNames ?? [];
}

export function parseSheet(
  fileName: string,
  sheetName: string
): { headers: string[]; rows: CellValue[][] } | null {
  const wb = cache.get(fileName);
  if (!wb) return null;
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return null;

  const rawRows = XLSX.utils.sheet_to_json<CellValue[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
    blankrows: false,
  }) as CellValue[][];

  const firstNonEmptyIdx = rawRows.findIndex(
    (row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== '')
  );

  if (firstNonEmptyIdx === -1) return { headers: [], rows: [] };

  const headers = (rawRows[firstNonEmptyIdx] as CellValue[]).map((cell) =>
    String(cell ?? '').trim()
  );

  const rows = rawRows
    .slice(firstNonEmptyIdx + 1)
    .filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== ''));

  return { headers, rows };
}
