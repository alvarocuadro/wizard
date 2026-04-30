import { useCallback, useState } from 'react';
import { normalize } from '../utils/normalize';
import { useWizardContext } from '../context/WizardContext';
import type { FinalOutput, TeamOutput, RoleGroup, MemberRef, TeamCatalogItem, AssignmentItem, LeaderAssignment } from '../utils/types';

function splitMemberName(label: string): MemberRef {
  const raw = String(label ?? '').trim();
  if (!raw) return { name: '', lastName: '' };
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { name: parts[0], lastName: '' };
  return { name: parts.slice(0, -1).join(' '), lastName: parts.slice(-1).join(' ') };
}

function buildTeamOutput(
  team: TeamCatalogItem,
  allTeams: TeamCatalogItem[],
  assignments: AssignmentItem[],
  leaderAssignments: LeaderAssignment[]
): TeamOutput {
  const childrenTeams = allTeams
    .filter((t) => (t.parentIds || []).includes(team.id))
    .map((t) => t.name)
    .sort((a, b) => a.localeCompare(b, 'es'));

  const byId = new Map(allTeams.map((t) => [t.id, t.name]));
  const parentsTeamsId = (team.parentIds || [])
    .map((pid) => byId.get(pid))
    .filter((n): n is string => Boolean(n))
    .sort((a, b) => a.localeCompare(b, 'es'));

  const leaderCfg = leaderAssignments.find((x) => x.teamId === team.id);
  const teamAssignments = assignments.filter(
    (a) => a.valid && normalize(a.team) === normalize(team.name)
  );

  const grouped = new Map<string, AssignmentItem[]>();
  teamAssignments.forEach((item) => {
    const key = item.role.trim();
    if (!key) return;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  });

  const roles: RoleGroup[] = Array.from(grouped.entries()).map(([roleName, items]) => {
    const members = items.map((it) => splitMemberName(it.member));
    const isTeamLead = !!leaderCfg && normalize(leaderCfg.leaderRole) === normalize(roleName);
    return {
      roleTypeId: roleName,
      members,
      teamId: team.name,
      isTeamLead,
      minQty: members.length > 0 ? 1 : 0,
      maxQty: members.length,
      parentsRolesId: isTeamLead ? [] : leaderCfg?.leaderRole ? [leaderCfg.leaderRole] : [],
    };
  });

  if (leaderCfg?.leaderRole && leaderCfg?.leaderPerson) {
    const exists = roles.some((r) => normalize(r.roleTypeId) === normalize(leaderCfg.leaderRole));
    if (!exists) {
      roles.unshift({
        roleTypeId: leaderCfg.leaderRole,
        members: [splitMemberName(leaderCfg.leaderPerson)],
        teamId: team.name,
        isTeamLead: true,
        minQty: 1,
        maxQty: 1,
        parentsRolesId: [],
      });
    }
  }

  roles.sort((a, b) => {
    if (a.isTeamLead && !b.isTeamLead) return -1;
    if (!a.isTeamLead && b.isTeamLead) return 1;
    return a.roleTypeId.localeCompare(b.roleTypeId, 'es');
  });

  const output: TeamOutput = { name: team.name, childrenTeams, roles };
  if (parentsTeamsId.length > 0) output.parentsTeamsId = parentsTeamsId;
  return output;
}

export function useFinalJsonBuilder() {
  const { state } = useWizardContext();
  const [copied, setCopied] = useState(false);

  const build = useCallback((): FinalOutput => {
    const { step3, step4, step5 } = state;
    const teams = step3.catalog.map((team) =>
      buildTeamOutput(team, step3.catalog, step4.catalog, step5.assignments)
    );
    return { teams };
  }, [state]);

  const buildJson = useCallback((): string => {
    return JSON.stringify(build(), null, 2);
  }, [build]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildJson());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }, [buildJson]);

  return { build, buildJson, copyToClipboard, copied };
}
