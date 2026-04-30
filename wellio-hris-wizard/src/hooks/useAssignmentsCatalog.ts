import { useCallback } from 'react';
import { normalize } from '../utils/normalize';
import type { CellValue, AssignmentColumnMapping, AssignmentItem, Step1State, RoleCatalogItem, TeamCatalogItem } from '../utils/types';
import { NONE_VALUE } from '../utils/constants';

function getColValue(row: CellValue[], headers: string[], colName: string): string {
  if (!colName || colName === NONE_VALUE) return '';
  const idx = headers.indexOf(colName);
  return idx >= 0 ? String(row[idx] ?? '').trim() : '';
}

function resolveFullName(
  rowIdx: number,
  rawMember: string,
  step1: Step1State,
  assignColHeader: string
): string {
  if (!step1.source) return rawMember;
  const { headers, rows } = step1.source;
  const { mapping } = step1;

  const firstHeader = mapping['firstName'] && mapping['firstName'] !== NONE_VALUE ? mapping['firstName'] : '';
  const lastHeader = mapping['lastName'] && mapping['lastName'] !== NONE_VALUE ? mapping['lastName'] : '';
  const emailHeader = mapping['workEmail'] && mapping['workEmail'] !== NONE_VALUE ? mapping['workEmail'] : '';

  const assignNorm = normalize(assignColHeader);
  const firstNorm = normalize(firstHeader);
  const lastNorm = normalize(lastHeader);

  const isMemberColFirstName = firstHeader && assignNorm === firstNorm;
  const isMemberColLastName = lastHeader && assignNorm === lastNorm;

  if ((isMemberColFirstName || isMemberColLastName) && rowIdx < rows.length) {
    const s1Row = rows[rowIdx];
    const firstIdx = firstHeader ? headers.indexOf(firstHeader) : -1;
    const lastIdx = lastHeader ? headers.indexOf(lastHeader) : -1;
    const first = firstIdx >= 0 ? String(s1Row[firstIdx] ?? '').trim() : '';
    const last = lastIdx >= 0 ? String(s1Row[lastIdx] ?? '').trim() : '';
    const full = [first, last].filter(Boolean).join(' ');
    if (full) return full;
  }

  if (rowIdx < rows.length) {
    const s1Row = rows[rowIdx];
    const firstIdx = firstHeader ? headers.indexOf(firstHeader) : -1;
    const lastIdx = lastHeader ? headers.indexOf(lastHeader) : -1;
    const emailIdx = emailHeader ? headers.indexOf(emailHeader) : -1;
    const first = firstIdx >= 0 ? String(s1Row[firstIdx] ?? '').trim() : '';
    const last = lastIdx >= 0 ? String(s1Row[lastIdx] ?? '').trim() : '';
    const email = emailIdx >= 0 ? String(s1Row[emailIdx] ?? '').trim() : '';
    const fullName = normalize(rawMember);
    const firstNormValue = normalize(first);
    if (fullName && firstNormValue && fullName === firstNormValue) {
      const full = [first, last].filter(Boolean).join(' ');
      if (full) return full;
    }
    if (email && normalize(email) === fullName) {
      const full = [first, last].filter(Boolean).join(' ');
      if (full) return full;
    }
  }

  return rawMember;
}

function validateItem(item: AssignmentItem, knownRoles: Set<string>, knownTeams: Set<string>): AssignmentItem {
  const errors: string[] = [];
  if (!item.member.trim()) errors.push('Miembro: obligatorio.');
  if (!item.role.trim()) errors.push('Rol: obligatorio.');
  if (!item.team.trim()) errors.push('Equipo: obligatorio.');
  if (item.role.trim() && knownRoles.size && !knownRoles.has(normalize(item.role))) {
    errors.push('Rol: no coincide con el catálogo del Paso 2.');
  }
  if (item.team.trim() && knownTeams.size && !knownTeams.has(normalize(item.team))) {
    errors.push('Equipo: no coincide con el catálogo del Paso 3.');
  }
  return { ...item, errors, valid: errors.length === 0 };
}

export function useAssignmentsCatalog() {
  const build = useCallback(
    (
      rows: CellValue[][],
      headers: string[],
      colMapping: AssignmentColumnMapping,
      step1: Step1State,
      roles: RoleCatalogItem[],
      teams: TeamCatalogItem[]
    ): AssignmentItem[] => {
      const knownRoles = new Set(roles.map((r) => normalize(r.name)));
      const knownTeams = new Set(teams.map((t) => normalize(t.name)));

      return rows.map((row, idx) => {
        const rawMember = getColValue(row, headers, colMapping.member);
        const role = getColValue(row, headers, colMapping.role);
        const team = getColValue(row, headers, colMapping.team);
        const member = resolveFullName(idx, rawMember, step1, colMapping.member);
        const item: AssignmentItem = { sourceRow: idx + 2, member, role, team, errors: [], valid: true };
        return validateItem(item, knownRoles, knownTeams);
      });
    },
    []
  );

  const revalidate = useCallback(
    (catalog: AssignmentItem[], roles: RoleCatalogItem[], teams: TeamCatalogItem[]): AssignmentItem[] => {
      const knownRoles = new Set(roles.map((r) => normalize(r.name)));
      const knownTeams = new Set(teams.map((t) => normalize(t.name)));
      return catalog.map((item) => validateItem(item, knownRoles, knownTeams));
    },
    []
  );

  const buildKnownMembers = useCallback((step1: Step1State): string[] => {
    if (!step1.source) return [];
    const { headers, rows } = step1.source;
    const { mapping } = step1;
    const firstHeader = mapping['firstName'] !== NONE_VALUE ? mapping['firstName'] : '';
    const lastHeader = mapping['lastName'] !== NONE_VALUE ? mapping['lastName'] : '';
    const emailHeader = mapping['workEmail'] !== NONE_VALUE ? mapping['workEmail'] : '';
    const seen = new Set<string>();
    const result: string[] = [];
    rows.forEach((row) => {
      const firstIdx = firstHeader ? headers.indexOf(firstHeader) : -1;
      const lastIdx = lastHeader ? headers.indexOf(lastHeader) : -1;
      const emailIdx = emailHeader ? headers.indexOf(emailHeader) : -1;
      const first = firstIdx >= 0 ? String(row[firstIdx] ?? '').trim() : '';
      const last = lastIdx >= 0 ? String(row[lastIdx] ?? '').trim() : '';
      const email = emailIdx >= 0 ? String(row[emailIdx] ?? '').trim() : '';
      const full = [first, last].filter(Boolean).join(' ').trim();
      const label = full || email;
      if (label && !seen.has(normalize(label))) {
        seen.add(normalize(label));
        result.push(label);
      }
    });
    return result.sort((a, b) => a.localeCompare(b, 'es'));
  }, []);

  const summary = useCallback((catalog: AssignmentItem[]) => ({
    total: catalog.length,
    valid: catalog.filter((a) => a.valid).length,
    invalid: catalog.filter((a) => !a.valid).length,
    hasErrors: catalog.some((a) => !a.valid),
  }), []);

  return { build, revalidate, buildKnownMembers, summary };
}
