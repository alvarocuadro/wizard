import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { FileParseResult, CellValue } from '../utils/types';
import {
  STEP1_TEMPLATE_METADATA_ROWS,
  STEP1_TEMPLATE_SHEET_NAME,
  validateStep1TemplateHeaders,
} from '../utils/step1Template';
import { STEP2_ROLES_SHEET_NAME } from '../utils/step2RolesTemplate';

export type ParseMode = 'default' | 'step1Template' | 'step2Roles';

interface ParseOptions {
  mode?: ParseMode;
}

interface UseFileParserReturn {
  parse: (file: File, options?: ParseOptions) => Promise<FileParseResult>;
  parseStored: (fileName: string, options?: ParseOptions) => Promise<FileParseResult>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const fileCache = new Map<string, File>();

function getTargetSheetName(mode: ParseMode): string | null {
  if (mode === 'step1Template') return STEP1_TEMPLATE_SHEET_NAME;
  if (mode === 'step2Roles') return STEP2_ROLES_SHEET_NAME;
  return null;
}

async function parseWorkbookFile(file: File, options: ParseOptions = {}): Promise<FileParseResult> {
  const mode = options.mode ?? 'default';
  fileCache.set(file.name, file);

  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  const targetSheetName = getTargetSheetName(mode);
  const sheetName = targetSheetName ?? workbook.SheetNames[0];

  if (!workbook.SheetNames.includes(sheetName)) {
    if (mode === 'step1Template') {
      throw new Error(
        `El archivo no coincide con la plantilla de carga masiva. La hoja del paso 1 debe llamarse "${STEP1_TEMPLATE_SHEET_NAME}".`
      );
    }

    if (mode === 'step2Roles') {
      throw new Error(
        `El archivo no coincide con la plantilla de roles. La hoja del paso 2 debe llamarse "${STEP2_ROLES_SHEET_NAME}".`
      );
    }

    throw new Error(`No se encontro la hoja "${sheetName}" en el archivo.`);
  }

  const sheet = workbook.Sheets[sheetName];
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

  if (mode === 'step1Template') {
    const templateError = validateStep1TemplateHeaders(headers);
    if (templateError) {
      throw new Error(`El archivo no coincide con la plantilla de carga masiva. ${templateError}`);
    }
  }

  const dataStartIndex = mode === 'step1Template' ? firstNonEmptyIdx + 1 + STEP1_TEMPLATE_METADATA_ROWS : firstNonEmptyIdx + 1;
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
}

export function useFileParser(): UseFileParserReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(async (file: File, options: ParseOptions = {}): Promise<FileParseResult> => {
    setLoading(true);
    setError(null);

    try {
      return await parseWorkbookFile(file, options);
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

  const parseStored = useCallback(
    async (fileName: string, options: ParseOptions = {}): Promise<FileParseResult> => {
      setLoading(true);
      setError(null);

      try {
        const file = fileCache.get(fileName);
        if (!file) {
          throw new Error(
            'No se encontro el archivo cargado previamente en esta sesion. Volve a subirlo para continuar.'
          );
        }

        return await parseWorkbookFile(file, options);
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : 'No se pudo leer el archivo guardado en memoria.';
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { parse, parseStored, loading, error, clearError: () => setError(null) };
}
