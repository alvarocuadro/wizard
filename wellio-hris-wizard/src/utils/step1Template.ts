import { NONE_VALUE } from './constants';
import { FIELDS } from './fields';
import { normalize } from './normalize';
import type { FieldMapping } from './types';

export const STEP1_TEMPLATE_SHEET_NAME = 'Miembros';
export const STEP1_TEMPLATE_HEADERS = [
  'Nombres',
  'Apellidos',
  'Email',
  'Legajo',
  'Fecha de ingreso',
  'Domicilio',
  'Localidad / Ciudad',
  'Provincia / Estado',
  'Código postal',
  'País',
  'Email personal',
  'Número de documento',
  'Identificador tributario',
  'Fecha de nacimiento',
  'Nacionalidad',
  'Género',
  'Ubicación',
  'Jornada laboral',
  'Horario de trabajo',
  'Modalidad de trabajo',
] as const;
export const STEP1_TEMPLATE_METADATA_ROWS = 2;

export function validateStep1TemplateSheetName(sheetName: string): string | null {
  if (sheetName.trim() !== STEP1_TEMPLATE_SHEET_NAME) {
    return `La hoja del paso 1 debe llamarse "${STEP1_TEMPLATE_SHEET_NAME}" y se encontro "${sheetName || 'vacia'}".`;
  }

  return null;
}

export function validateStep1TemplateHeaders(headers: readonly string[]): string | null {
  if (headers.length !== STEP1_TEMPLATE_HEADERS.length) {
    return `La plantilla debe tener exactamente ${STEP1_TEMPLATE_HEADERS.length} columnas. Se encontraron ${headers.length}.`;
  }

  for (let index = 0; index < STEP1_TEMPLATE_HEADERS.length; index += 1) {
    const expected = STEP1_TEMPLATE_HEADERS[index];
    const actual = headers[index] ?? '';

    if (normalize(actual) !== normalize(expected)) {
      return `La columna ${index + 1} debe ser "${expected}" y se encontro "${actual || 'vacia'}".`;
    }
  }

  return null;
}

export function buildStep1TemplateMapping(headers: readonly string[]): FieldMapping {
  return FIELDS.reduce<FieldMapping>((mapping, field) => {
    const matchedHeader =
      headers.find((header) => normalize(header) === normalize(field.templateHeader)) ?? NONE_VALUE;

    mapping[field.key] = matchedHeader;
    return mapping;
  }, {});
}
