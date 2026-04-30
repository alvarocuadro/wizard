import { useCallback } from 'react';
import { normalize } from '../utils/normalize';
import { validateRoleName } from '../utils/validators';
import type { CellValue, RoleCatalogItem } from '../utils/types';

function buildCatalog(rows: CellValue[][], headers: string[], column: string, prev: RoleCatalogItem[]): RoleCatalogItem[] {
  if (!column || column === '__none__') return [];
  const colIdx = headers.indexOf(column);
  if (colIdx < 0) return [];

  const map = new Map<string, RoleCatalogItem>();
  rows.forEach((row) => {
    const value = String(row[colIdx] ?? '').trim();
    if (!value) return;
    const id = normalize(value);
    if (!map.has(id)) map.set(id, { id, name: value, hasReports: false, errors: [], valid: true });
  });

  const prevById = new Map(prev.map((r) => [r.id, r]));
  const catalog = Array.from(map.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map((item) => {
      const existing = prevById.get(item.id);
      return existing ? { ...item, hasReports: existing.hasReports } : item;
    });

  return catalog.map((r) => {
    const errors = validateRoleName(r.name);
    return { ...r, errors, valid: errors.length === 0 };
  });
}

export function useRolesCatalog() {
  const build = useCallback(
    (rows: CellValue[][], headers: string[], column: string, prev: RoleCatalogItem[] = []): RoleCatalogItem[] =>
      buildCatalog(rows, headers, column, prev),
    []
  );

  const validate = useCallback((catalog: RoleCatalogItem[]): RoleCatalogItem[] =>
    catalog.map((r) => {
      const errors = validateRoleName(r.name);
      return { ...r, errors, valid: errors.length === 0 };
    }),
    []
  );

  const summary = useCallback((catalog: RoleCatalogItem[]) => ({
    total: catalog.length,
    valid: catalog.filter((r) => r.valid).length,
    invalid: catalog.filter((r) => !r.valid).length,
    hasErrors: catalog.some((r) => !r.valid),
  }), []);

  return { build, validate, summary };
}
