import { normalize } from './normalize';
import type { CellValue } from './types';

export const STEP2_ROLES_SHEET_NAME = 'Roles';

export function parseHasReportsValue(value: CellValue): boolean {
  return normalize(value) === 'si';
}
