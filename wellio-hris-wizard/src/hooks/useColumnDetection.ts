import { useCallback } from 'react';
import { normalize } from '../utils/normalize';
import { FIELDS } from '../utils/fields';
import { NONE_VALUE, SCORE_EXACT, SCORE_CONTAINS, ROLE_COLUMN_ALIASES, TEAM_COLUMN_ALIASES } from '../utils/constants';
import type { FieldMapping, AssignmentColumnMapping } from '../utils/types';
import type { WizardField } from '../utils/fields';

function scoreHeader(field: WizardField, header: string): number {
  const nh = normalize(header);
  if (!nh) return 0;
  let score = 0;

  (field.aliases || []).forEach((alias) => {
    const na = normalize(alias);
    if (nh === na) score += SCORE_EXACT;
    else if (nh.includes(na)) score += SCORE_CONTAINS;
  });

  if (field.key === 'workEmail' || field.key === 'personalEmail') {
    if (nh.includes('mail') || nh.includes('email') || nh.includes('correo')) score += 40;
    if (field.key === 'workEmail' && (nh.includes('laboral') || nh.includes('corporativo'))) score += 40;
    if (field.key === 'personalEmail' && nh.includes('personal')) score += 40;
  }
  if (field.type === 'date' && nh.includes('fecha')) score += 20;
  if (field.key === 'firstName') {
    if (nh === 'nombre') score += 40;
    if (nh.includes('apellido')) score -= 120;
  }
  if (field.key === 'lastName') {
    if (nh === 'apellido') score += 40;
    if (nh.includes('nombre')) score -= 120;
  }

  return score;
}

function scoreGeneric(header: string, aliases: string[]): number {
  const nh = normalize(header);
  let score = 0;
  aliases.forEach((alias) => {
    const na = normalize(alias);
    if (nh === na) score += SCORE_EXACT;
    else if (nh.includes(na)) score += SCORE_CONTAINS;
  });
  return score;
}

export function useColumnDetection() {
  const detectMappings = useCallback((headers: string[]): FieldMapping => {
    const available = headers.map((h, i) => ({ header: h, index: i }));
    const result: FieldMapping = {};
    const used = new Set<number>();

    FIELDS.forEach((field) => {
      const ranked = available
        .map((item) => ({ ...item, score: scoreHeader(field, item.header) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked.find((item) => item.score > 0 && !used.has(item.index));
      if (best) {
        result[field.key] = best.header;
        used.add(best.index);
      } else {
        result[field.key] = NONE_VALUE;
      }
    });

    return result;
  }, []);

  const detectSingleColumn = useCallback((headers: string[], aliases: string[]): string => {
    let best = { header: NONE_VALUE, score: 0 };
    headers.forEach((header) => {
      const score = scoreGeneric(header, aliases);
      if (score > best.score) best = { header, score };
    });
    return best.score > 0 ? best.header : NONE_VALUE;
  }, []);

  const detectRoleColumn = useCallback(
    (headers: string[]) => detectSingleColumn(headers, ROLE_COLUMN_ALIASES),
    [detectSingleColumn]
  );

  const detectTeamColumn = useCallback(
    (headers: string[]) => detectSingleColumn(headers, TEAM_COLUMN_ALIASES),
    [detectSingleColumn]
  );

  const detectAssignmentColumns = useCallback((headers: string[]): AssignmentColumnMapping => {
    const configs: Record<keyof AssignmentColumnMapping, string[]> = {
      member: ['nombre', 'apellido', 'miembro', 'empleado', 'persona', 'employee', 'full name', 'mail laboral', 'email laboral'],
      role: ROLE_COLUMN_ALIASES,
      team: TEAM_COLUMN_ALIASES,
    };
    const used = new Set<string>();
    const result: AssignmentColumnMapping = { member: NONE_VALUE, role: NONE_VALUE, team: NONE_VALUE };

    (Object.keys(configs) as (keyof AssignmentColumnMapping)[]).forEach((key) => {
      const ranked = headers
        .map((h) => ({ header: h, score: scoreGeneric(h, configs[key]) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked.find((x) => x.score > 0 && !used.has(x.header));
      if (best) {
        result[key] = best.header;
        used.add(best.header);
      }
    });

    return result;
  }, []);

  return { detectMappings, detectSingleColumn, detectRoleColumn, detectTeamColumn, detectAssignmentColumns };
}
