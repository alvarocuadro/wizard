import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { cacheWorkbook, parseSheet } from '../utils/workbookCache';
import type { FileParseResult } from '../utils/types';

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
      cacheWorkbook(file.name, workbook);

      const sheetNames = workbook.SheetNames;

      // Auto-detect: first sheet that has at least one non-empty header
      let selectedSheet = sheetNames[0];
      for (const name of sheetNames) {
        const result = parseSheet(file.name, name);
        if (result && result.headers.some((h) => h !== '')) {
          selectedSheet = name;
          break;
        }
      }

      const sheetData = parseSheet(file.name, selectedSheet);
      if (!sheetData) throw new Error('No se pudo leer la hoja seleccionada.');

      const { headers, rows } = sheetData;

      if (!headers.some((h) => h !== '')) {
        throw new Error('No se detectaron encabezados válidos.');
      }

      return { fileName: file.name, sheetName: selectedSheet, sheetNames, headers, rows };
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
