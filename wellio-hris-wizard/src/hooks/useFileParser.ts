import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { FileParseResult, CellValue } from '../utils/types';
import {
  STEP1_TEMPLATE_METADATA_ROWS,
  validateStep1TemplateHeaders,
} from '../utils/step1Template';

interface ParseOptions {
  mode?: 'default' | 'step1Template';
}

interface UseFileParserReturn {
  parse: (file: File, options?: ParseOptions) => Promise<FileParseResult>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useFileParser(): UseFileParserReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(async (file: File, options: ParseOptions = {}): Promise<FileParseResult> => {
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
        throw new Error('No se detectaron encabezados en la primera fila util del archivo.');
      }

      const headers = (rawRows[firstNonEmptyIdx] as CellValue[]).map((cell) =>
        String(cell ?? '').trim()
      );

      if (!headers.some((header) => header !== '')) {
        throw new Error('No se detectaron encabezados validos.');
      }

      if (options.mode === 'step1Template') {
        const templateError = validateStep1TemplateHeaders(headers);
        if (templateError) {
          throw new Error(`El archivo no coincide con la plantilla de carga masiva. ${templateError}`);
        }
      }

      const dataStartIndex =
        options.mode === 'step1Template'
          ? firstNonEmptyIdx + 1 + STEP1_TEMPLATE_METADATA_ROWS
          : firstNonEmptyIdx + 1;

      const rows = rawRows
        .slice(dataStartIndex)
        .filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== ''));

      return {
        fileName: file.name,
        headers,
        rows,
        headerRowNumber: firstNonEmptyIdx + 1,
        dataStartRowNumber: dataStartIndex + 1,
      };
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : 'No se pudo leer el archivo. Proba con un .xlsx, .xls, .csv o .xltx valido.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { parse, loading, error, clearError: () => setError(null) };
}
