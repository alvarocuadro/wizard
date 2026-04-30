import { useCallback } from 'react';
import { normalize } from '../utils/normalize';
import { validateTeamName } from '../utils/validators';
import type { CellValue, TeamCatalogItem } from '../utils/types';

export function detectLoop(catalog: TeamCatalogItem[]): boolean {
  const ids = new Set(catalog.map((t) => t.id));
  const graph = new Map<string, string[]>();
  catalog.forEach((t) => {
    graph.set(t.id, (t.parentIds || []).filter((pid) => ids.has(pid) && pid !== t.id));
  });
  const visited = new Set<string>();
  const inStack = new Set<string>();
  function dfs(node: string): boolean {
    if (inStack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    inStack.add(node);
    for (const parent of graph.get(node) || []) {
      if (dfs(parent)) return true;
    }
    inStack.delete(node);
    return false;
  }
  for (const node of graph.keys()) {
    if (!visited.has(node) && dfs(node)) return true;
  }
  return false;
}

export function buildTreeLines(catalog: TeamCatalogItem[]): string[] {
  if (!catalog.length) return [];
  const byId = new Map(catalog.map((t) => [t.id, t]));
  const childrenByParent = new Map<string, string[]>();
  const roots: string[] = [];
  const idSet = new Set(catalog.map((t) => t.id));

  catalog.forEach((team) => {
    const parents = (team.parentIds || []).filter((pid) => idSet.has(pid));
    if (team.isMain || parents.length === 0) {
      roots.push(team.id);
    } else {
      parents.forEach((pid) => {
        if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
        childrenByParent.get(pid)!.push(team.id);
      });
    }
  });

  const lines: string[] = [];
  function walk(nodeId: string, depth: number, path: Set<string>) {
    const team = byId.get(nodeId);
    if (!team) return;
    lines.push((depth === 0 ? '' : '  '.repeat(depth - 1) + '- ') + team.name);
    if (path.has(nodeId)) return;
    const next = new Set(path);
    next.add(nodeId);
    const children = (childrenByParent.get(nodeId) || []).sort((a, b) =>
      (byId.get(a)?.name ?? '').localeCompare(byId.get(b)?.name ?? '', 'es')
    );
    children.forEach((c) => walk(c, depth + 1, next));
  }
  roots
    .sort((a, b) => (byId.get(a)?.name ?? '').localeCompare(byId.get(b)?.name ?? '', 'es'))
    .forEach((r) => walk(r, 0, new Set()));
  return lines;
}

function validateAll(catalog: TeamCatalogItem[]): TeamCatalogItem[] {
  const mainCount = catalog.filter((t) => t.isMain).length;
  const hasLoop = detectLoop(catalog);
  return catalog.map((team) => {
    const errors = [...validateTeamName(team.name)];
    if ((team.parentIds || []).includes(team.id)) errors.push('Un equipo no puede ser padre de sí mismo.');
    if (hasLoop) errors.push('Se detectó un loop jerárquico entre equipos.');
    if (mainCount === 0) errors.push('Debe existir exactamente 1 equipo principal.');
    else if (mainCount > 1) errors.push('Solo puede existir 1 equipo principal.');
    return { ...team, errors, valid: errors.length === 0 };
  });
}

export function useTeamsCatalog() {
  const build = useCallback(
    (rows: CellValue[][], headers: string[], column: string, prev: TeamCatalogItem[] = []): TeamCatalogItem[] => {
      if (!column || column === '__none__') return [];
      const colIdx = headers.indexOf(column);
      if (colIdx < 0) return [];

      const map = new Map<string, TeamCatalogItem>();
      rows.forEach((row) => {
        const value = String(row[colIdx] ?? '').trim();
        if (!value) return;
        const id = normalize(value);
        if (!map.has(id)) {
          map.set(id, { id, name: value, isMain: false, leadershipMode: 'own', parentIds: [], errors: [], valid: true });
        }
      });

      const prevById = new Map(prev.map((t) => [t.id, t]));
      const catalog = Array.from(map.values())
        .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        .map((item) => {
          const existing = prevById.get(item.id);
          return existing ? { ...item, isMain: existing.isMain, leadershipMode: existing.leadershipMode, parentIds: existing.parentIds } : item;
        });

      return validateAll(catalog);
    },
    []
  );

  const revalidate = useCallback((catalog: TeamCatalogItem[]): TeamCatalogItem[] => validateAll(catalog), []);

  const getTreeLines = useCallback((catalog: TeamCatalogItem[]): string[] => buildTreeLines(catalog), []);

  const summary = useCallback((catalog: TeamCatalogItem[]) => {
    const hasLoop = detectLoop(catalog);
    return {
      total: catalog.length,
      valid: catalog.filter((t) => t.valid).length,
      invalid: catalog.filter((t) => !t.valid).length,
      mainCount: catalog.filter((t) => t.isMain).length,
      hasLoop,
      hasErrors: catalog.some((t) => !t.valid),
    };
  }, []);

  return { build, revalidate, getTreeLines, summary };
}
