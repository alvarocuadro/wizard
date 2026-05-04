import { useCallback } from 'react';
import { normalize } from '../utils/normalize';
import { validateRoleName } from '../utils/validators';
import { parseHasReportsValue } from '../utils/step2RolesTemplate';
import type { CellValue, RoleCatalogItem } from '../utils/types';

function buildCatalog(rows: CellValue[][], prev: RoleCatalogItem[]): RoleCatalogItem[] {
  const uniqueById = new Map<string, RoleCatalogItem>();
  const incompleteRows: RoleCatalogItem[] = [];

  rows.forEach((row, index) => {
    const roleName = String(row[0] ?? '').trim();
    const hasReports = parseHasReportsValue(row[1]);

    if (!roleName) {
      incompleteRows.push({
        id: `row-${index + 1}`,
        name: '',
        hasReports,
        errors: validateRoleName(''),
        valid: false,
      });
      return;
    }

    const id = normalize(roleName);
    const existing = uniqueById.get(id);
    if (!existing) {
      uniqueById.set(id, { id, name: roleName, hasReports, errors: [], valid: true });
      return;
    }

    existing.hasReports = existing.hasReports || hasReports;
  });

  const prevById = new Map(prev.map((role) => [role.id, role]));
  const catalog = Array.from(uniqueById.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map((item) => {
      const existing = prevById.get(item.id);
      return existing ? { ...item, name: existing.name, hasReports: existing.hasReports } : item;
    })
    .map((role) => {
      const errors = validateRoleName(role.name);
      return { ...role, errors, valid: errors.length === 0 };
    });

  return [...catalog, ...incompleteRows];
}

export function useRolesCatalog() {
  const build = useCallback(
    (rows: CellValue[][], prev: RoleCatalogItem[] = []): RoleCatalogItem[] => buildCatalog(rows, prev),
    []
  );

  const validate = useCallback(
    (catalog: RoleCatalogItem[]): RoleCatalogItem[] =>
      catalog.map((role) => {
        const errors = validateRoleName(role.name);
        return { ...role, errors, valid: errors.length === 0 };
      }),
    []
  );

  const summary = useCallback(
    (catalog: RoleCatalogItem[]) => ({
      total: catalog.length,
      valid: catalog.filter((role) => role.valid).length,
      invalid: catalog.filter((role) => !role.valid).length,
      hasErrors: catalog.some((role) => !role.valid),
    }),
    []
  );

  return { build, validate, summary };
}
