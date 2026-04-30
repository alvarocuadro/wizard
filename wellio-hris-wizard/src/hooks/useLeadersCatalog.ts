import { useCallback } from 'react';
import { normalize } from '../utils/normalize';
import type { TeamCatalogItem, AssignmentItem, LeaderAssignment } from '../utils/types';

function validateAssignment(item: LeaderAssignment): LeaderAssignment {
  const errors: string[] = [];
  if (!item.leaderRole.trim()) errors.push('Rol líder: obligatorio.');
  if (!item.leaderPerson.trim()) errors.push('Persona líder: obligatoria.');

  const candidates = item.candidates || [];
  if (item.leaderRole.trim() && candidates.length) {
    const roleMatch = candidates.some((c) => normalize(c.role) === normalize(item.leaderRole));
    if (!roleMatch) errors.push('Rol líder: no coincide con un puesto del equipo.');
  }
  if (item.leaderPerson.trim() && candidates.length) {
    const personMatch = candidates.some((c) => normalize(c.member) === normalize(item.leaderPerson));
    if (!personMatch) errors.push('Persona líder: no coincide con una persona del equipo.');
  }
  if (item.leaderRole.trim() && item.leaderPerson.trim() && candidates.length) {
    const exactMatch = candidates.some(
      (c) => normalize(c.role) === normalize(item.leaderRole) && normalize(c.member) === normalize(item.leaderPerson)
    );
    if (!exactMatch) errors.push('La combinación persona + rol no existe en las asociaciones del equipo.');
  }

  return { ...item, errors, valid: errors.length === 0 };
}

export function useLeadersCatalog() {
  const build = useCallback(
    (teams: TeamCatalogItem[], assignments: AssignmentItem[], prev: LeaderAssignment[] = []): LeaderAssignment[] => {
      const ownTeams = teams.filter((t) => t.leadershipMode === 'own');
      const prevByTeamId = new Map(prev.map((x) => [x.teamId, x]));

      const result = ownTeams.map((team) => {
        const candidates = assignments.filter(
          (a) => a.valid && normalize(a.team) === normalize(team.name)
        );
        const existing = prevByTeamId.get(team.id);
        const item: LeaderAssignment = {
          teamId: team.id,
          teamName: team.name,
          leaderRole: existing?.leaderRole ?? '',
          leaderPerson: existing?.leaderPerson ?? '',
          candidates,
          errors: [],
          valid: true,
        };
        return validateAssignment(item);
      });

      return result;
    },
    []
  );

  const update = useCallback(
    (assignments: LeaderAssignment[], teamId: string, changes: Partial<LeaderAssignment>): LeaderAssignment[] => {
      return assignments.map((a) => {
        if (a.teamId !== teamId) return a;
        let updated = { ...a, ...changes };
        // If role changed, clear person if no longer valid
        if (changes.leaderRole !== undefined && changes.leaderRole !== a.leaderRole) {
          const validPersons = new Set(
            a.candidates
              .filter((c) => normalize(c.role) === normalize(changes.leaderRole!))
              .map((c) => normalize(c.member))
          );
          if (updated.leaderPerson && !validPersons.has(normalize(updated.leaderPerson))) {
            updated = { ...updated, leaderPerson: '' };
          }
        }
        return validateAssignment(updated);
      });
    },
    []
  );

  const summary = useCallback((assignments: LeaderAssignment[]) => ({
    total: assignments.length,
    valid: assignments.filter((a) => a.valid).length,
    invalid: assignments.filter((a) => !a.valid).length,
    hasErrors: assignments.some((a) => !a.valid),
  }), []);

  return { build, update, summary };
}
