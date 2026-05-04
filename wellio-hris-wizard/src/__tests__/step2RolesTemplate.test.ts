import { describe, expect, it } from 'vitest';
import { parseHasReportsValue, STEP2_ROLES_SHEET_NAME } from '../utils/step2RolesTemplate';

describe('step2RolesTemplate', () => {
  it('exposes the expected sheet name', () => {
    expect(STEP2_ROLES_SHEET_NAME).toBe('Roles');
  });

  it('marks hasReports only when the cell says si', () => {
    expect(parseHasReportsValue('si')).toBe(true);
    expect(parseHasReportsValue('SI')).toBe(true);
    expect(parseHasReportsValue('sí')).toBe(true);
    expect(parseHasReportsValue('no')).toBe(false);
    expect(parseHasReportsValue('')).toBe(false);
  });
});
