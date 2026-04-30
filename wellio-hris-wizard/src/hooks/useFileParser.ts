import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { FileParseResult, CellValue } from '../utils/types';

interface UseFileParserReturn {
  parse: (file: File) => Promise<FileParseResult>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useFileParser(): UseFileParserReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(async (file: File): Promise<FileParseResult> => {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<CellValue[]>(sheet, {
        header: 1,
        defval: '',
        raw: true,
        blankrows: false,
      }) as CellValue[][];

      const firstNonEmptyIdx = rawRows.findIndex(
        (row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== '')
      );

      if (firstNonEmptyIdx === -1) {
        throw new Error('No se detectaron encabezados en la primera fila útil del archivo.');
      }

      const headers = (rawRows[firstNonEmptyIdx] as CellValue[]).map((cell) =>
        String(cell ?? '').trim()
      );

      if (!headers.some((h) => h !== '')) {
        throw new Error('No se detectaron encabezados válidos.');
      }

      const rows = rawRows
        .slice(firstNonEmptyIdx + 1)
        .filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== ''));

      return { fileName: file.name, headers, rows };
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : 'No se pudo leer el archivo. Probá con un .xlsx, .xls o .csv válido.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { parse, loading, error, clearError: () => setError(null) };
}
