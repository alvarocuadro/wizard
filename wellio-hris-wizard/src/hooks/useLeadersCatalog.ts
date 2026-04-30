import { useCallback } from 'react';
import { normalize } from '../utils/normalize';
import type { TeamCatalogItem, AssignmentItem, LeaderAssignment } from '../utils/types';

function getUniqueRoles(candidates: AssignmentItem[]): string[] {
  return candidates
    .map((candidate) => candidate.role.trim())
    .filter(Boolean)
    .filter(
      (role, index, arr) =>
        arr.findIndex((value) => normalize(value) === normalize(role)) === index
    )
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

function getPersonsForRole(candidates: AssignmentItem[], leaderRole: string): string[] {
  if (!leaderRole.trim()) return [];
  return candidates
    .filter((candidate) => normalize(candidate.role) === normalize(leaderRole))
    .map((candidate) => candidate.member)
    .filter(
      (member, index, arr) =>
        arr.findIndex((value) => normalize(value) === normalize(member)) === index
    )
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

function validateAssignment(item: LeaderAssignment): LeaderAssignment {
  const errors: string[] = [];
  if (!item.leaderRole.trim()) errors.push('Rol lider: obligatorio.');

  const candidates = item.candidates || [];
  const personsForRole = getPersonsForRole(candidates, item.leaderRole);
  const selectedPersons =
    item.leaderSelectionMode === 'all' ? personsForRole : item.leaderPersons;

  if (item.leaderRole.trim() && candidates.length) {
    const roleMatch = candidates.some((candidate) => normalize(candidate.role) === normalize(item.leaderRole));
    if (!roleMatch) errors.push('Rol lider: no coincide con un puesto del equipo.');
  }

  if (item.leaderRole.trim() && selectedPersons.length === 0) {
    errors.push('Persona lider: selecciona al menos una persona.');
  }

  const unknownPersons = selectedPersons.filter(
    (person) => !personsForRole.some((candidate) => normalize(candidate) === normalize(person))
  );
  if (unknownPersons.length > 0) {
    errors.push('Persona lider: hay personas que no coinciden con el rol elegido en este equipo.');
  }

  return {
    ...item,
    leaderPersons: selectedPersons,
    errors,
    valid: errors.length === 0,
  };
}

export function useLeadersCatalog() {
  const build = useCallback(
    (
      teams: TeamCatalogItem[],
      assignments: AssignmentItem[],
      prev: LeaderAssignment[] = []
    ): LeaderAssignment[] => {
      const ownTeams = teams.filter((team) => team.leadershipMode === 'own');
      const prevByTeamId = new Map(prev.map((item) => [item.teamId, item]));

      return ownTeams.map((team) => {
        const candidates = assignments.filter(
          (assignment) => assignment.valid && normalize(assignment.team) === normalize(team.name)
        );
        const existing = prevByTeamId.get(team.id);
        const uniqueRoles = getUniqueRoles(candidates);
        const autoLeaderRole = uniqueRoles.length === 1 ? uniqueRoles[0] : '';
        const autoLeaderPersons = autoLeaderRole ? getPersonsForRole(candidates, autoLeaderRole) : [];
        const hasExistingLeaderPersons = (existing?.leaderPersons?.length ?? 0) > 0;
        const item: LeaderAssignment = {
          teamId: team.id,
          teamName: team.name,
          leaderRole: existing?.leaderRole || autoLeaderRole,
          leaderSelectionMode:
            existing?.leaderSelectionMode ?? (autoLeaderPersons.length > 1 ? 'all' : 'specific'),
          leaderPersons: hasExistingLeaderPersons ? existing!.leaderPersons : autoLeaderPersons,
          candidates,
          errors: [],
          valid: true,
        };
        return validateAssignment(item);
      });
    },
    []
  );

  const update = useCallback(
    (
      assignments: LeaderAssignment[],
      teamId: string,
      changes: Partial<LeaderAssignment>
    ): LeaderAssignment[] => {
      return assignments.map((assignment) => {
        if (assignment.teamId !== teamId) return assignment;

        let updated = { ...assignment, ...changes };
        const roleChanged =
          changes.leaderRole !== undefined && changes.leaderRole !== assignment.leaderRole;
        const selectionModeChanged =
          changes.leaderSelectionMode !== undefined &&
          changes.leaderSelectionMode !== assignment.leaderSelectionMode;

        if (roleChanged) {
          const personsForRole = getPersonsForRole(
            assignment.candidates,
            changes.leaderRole ?? ''
          );
          if (personsForRole.length === 1) {
            updated = {
              ...updated,
              leaderSelectionMode: 'specific',
              leaderPersons: personsForRole,
            };
          } else {
            const currentPersons = (updated.leaderPersons ?? []).filter((person) =>
              personsForRole.some((candidate) => normalize(candidate) === normalize(person))
            );
            updated = {
              ...updated,
              leaderPersons:
                updated.leaderSelectionMode === 'all' ? personsForRole : currentPersons,
            };
          }
        }

        if (selectionModeChanged) {
          const personsForRole = getPersonsForRole(assignment.candidates, updated.leaderRole);
          updated = {
            ...updated,
            leaderPersons:
              changes.leaderSelectionMode === 'all' ? personsForRole : updated.leaderPersons,
          };
        }

        if (changes.leaderPersons !== undefined) {
          const personsForRole = getPersonsForRole(assignment.candidates, updated.leaderRole);
          updated = {
            ...updated,
            leaderPersons: changes.leaderPersons.filter((person) =>
              personsForRole.some((candidate) => normalize(candidate) === normalize(person))
            ),
          };
        }

        return validateAssignment(updated);
      });
    },
    []
  );

  const summary = useCallback(
    (assignments: LeaderAssignment[]) => ({
      total: assignments.length,
      valid: assignments.filter((assignment) => assignment.valid).length,
      invalid: assignments.filter((assignment) => !assignment.valid).length,
      hasErrors: assignments.some((assignment) => !assignment.valid),
    }),
    []
  );

  return { build, update, summary };
}
