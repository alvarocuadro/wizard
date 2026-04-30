import { useCallback } from 'react';
import { FIELDS } from '../utils/fields';
import { validateFieldValue } from '../utils/validators';
import { normalize } from '../utils/normalize';
import type { CellValue, FieldMapping, FieldDefaultValues, WorkModeValueMap, NormalizedRow, RowMeta, ValidationResult, ProcessedRow } from '../utils/types';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDDMMYYYY(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function excelSerialToDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const d = new Date(utcDays * 86400 * 1000);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function normalizeDate(value: CellValue): { value: string; changed: boolean; detectedFormat: string | null } {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return { value: formatDDMMYYYY(value), changed: true, detectedFormat: 'Date object' };
  }
  if (typeof value === 'number' && !isNaN(value) && value > 1) {
    const d = excelSerialToDate(value);
    if (!isNaN(d.getTime())) return { value: formatDDMMYYYY(d), changed: true, detectedFormat: 'Excel serial' };
  }

  const raw = String(value ?? '').trim();
  if (!raw) return { value: '', changed: false, detectedFormat: null };

  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  let m = raw.match(ddmmyyyy);
  if (m) {
    const [, d, mo, y] = m.map(Number);
    const date = new Date(y, mo - 1, d);
    if (date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d)
      return { value: raw, changed: false, detectedFormat: 'DD/MM/AAAA' };
  }

  m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [, y, mo, d] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d));
    if (date.getFullYear() === Number(y) && date.getMonth() === Number(mo) - 1 && date.getDate() === Number(d))
      return { value: `${d}/${mo}/${y}`, changed: true, detectedFormat: 'AAAA-MM-DD' };
  }

  m = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d));
    if (date.getFullYear() === Number(y) && date.getMonth() === Number(mo) - 1 && date.getDate() === Number(d))
      return { value: `${d}/${mo}/${y}`, changed: true, detectedFormat: 'DD-MM-AAAA' };
  }

  m = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d));
    if (date.getFullYear() === Number(y) && date.getMonth() === Number(mo) - 1 && date.getDate() === Number(d))
      return { value: `${d}/${mo}/${y}`, changed: true, detectedFormat: 'DD.MM.AAAA' };
  }

  m = raw.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (m) {
    const [, d, mo, yy] = m;
    const fullYear = Number(yy) >= 70 ? `19${yy}` : `20${yy}`;
    const date = new Date(Number(fullYear), Number(mo) - 1, Number(d));
    if (date.getFullYear() === Number(fullYear) && date.getMonth() === Number(mo) - 1 && date.getDate() === Number(d))
      return { value: `${d}/${mo}/${fullYear}`, changed: true, detectedFormat: 'DD/MM/AA' };
  }

  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return { value: formatDDMMYYYY(parsed), changed: true, detectedFormat: 'Date.parse' };

  return { value: raw, changed: false, detectedFormat: null };
}

function normalizeWorkMode(value: CellValue, workModeMap: WorkModeValueMap): { value: string; changed: boolean } {
  const raw = String(value ?? '').trim();
  if (!raw) return { value: '', changed: false };

  const entries = Object.entries(workModeMap) as [string, string][];
  const configured = entries.find(([, src]) => src && normalize(src) === normalize(raw));
  if (configured) return { value: configured[0], changed: raw !== configured[0] };

  const n = normalize(raw);
  if (n === 'presencial') return { value: 'Presencial', changed: raw !== 'Presencial' };
  if (['hibrido', 'hibrida', 'mixto', 'hybrid'].includes(n)) return { value: 'Híbrido', changed: raw !== 'Híbrido' };
  if (['remoto', 'remote', 'home office', 'teletrabajo'].includes(n)) return { value: 'Remoto', changed: raw !== 'Remoto' };

  return { value: raw, changed: false };
}

export function useRowValidation() {
  const normalizeRow = useCallback(
    (
      row: CellValue[],
      mapping: FieldMapping,
      headers: string[],
      workModeMap: WorkModeValueMap,
      defaultValues: FieldDefaultValues = {}
    ): { normalized: NormalizedRow; meta: RowMeta } => {
      const normalized: NormalizedRow = {};
      const meta: RowMeta = {};

      FIELDS.forEach((field) => {
        const header = mapping[field.key];
        const colIdx = header && header !== '__none__' ? headers.indexOf(header) : -1;
        const fallbackValue = field.required ? '' : (defaultValues[field.key] ?? '');
        const rawValue = colIdx >= 0 ? row[colIdx] : fallbackValue;

        if (field.type === 'date') {
          const info = normalizeDate(rawValue);
          normalized[field.key] = info.value;
          meta[`${field.key}_detectedFormat`] = info.detectedFormat;
          meta[`${field.key}_changed`] = info.changed;
        } else if (field.key === 'workMode') {
          const info = normalizeWorkMode(rawValue, workModeMap);
          normalized[field.key] = info.value;
          meta[`${field.key}_changed`] = info.changed;
        } else {
          normalized[field.key] = String(rawValue ?? '').trim();
        }
      });

      return { normalized, meta };
    },
    []
  );

  const validateSingle = useCallback((normalized: NormalizedRow): string[] => {
    const errors: string[] = [];
    FIELDS.forEach((field) => {
      const value = normalized[field.key] ?? '';
      const fieldErrors = validateFieldValue(value, {
        required: field.required,
        type: field.type,
        maxLength: field.maxLength,
        isNameField: field.key === 'firstName' || field.key === 'lastName',
      });
      fieldErrors.forEach((e) => errors.push(`${field.label}: ${e}`));
    });
    return errors;
  }, []);

  const validateAll = useCallback(
    (
      rows: CellValue[][],
      mapping: FieldMapping,
      headers: string[],
      workModeMap: WorkModeValueMap,
      defaultValues: FieldDefaultValues = {}
    ): ValidationResult[] => {
      return rows.map((row, i) => {
        const { normalized, meta } = normalizeRow(row, mapping, headers, workModeMap, defaultValues);
        const errors = validateSingle(normalized);
        return { rowNumber: i + 2, raw: row, normalized, meta, errors, valid: errors.length === 0, omitted: false };
      });
    },
    [normalizeRow, validateSingle]
  );

  const buildProcessedRows = useCallback((results: ValidationResult[]): ProcessedRow[] => {
    return results
      .filter((r) => r.valid && !r.omitted)
      .map((r) => {
        const out: ProcessedRow = {};
        FIELDS.forEach((f) => { out[f.label] = r.normalized[f.key] ?? ''; });
        return out;
      });
  }, []);

  return { normalizeRow, validateSingle, validateAll, buildProcessedRows };
}
