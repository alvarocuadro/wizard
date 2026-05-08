import { useState } from 'react';
import type { DragEvent } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CloseIcon from '@mui/icons-material/Close';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import type { TeamCatalogItem } from '../../utils/types';

// ── Tree helpers ──────────────────────────────────────────────────────────────

interface TreeNode {
  team: TeamCatalogItem;
  parentId: string | null; // which parent this occurrence renders under
  children: TreeNode[];
}

/**
 * Builds a tree supporting multiple parents:
 * a team with parentIds = ['A','B'] appears under both A and B.
 */
function buildTree(placed: TeamCatalogItem[]): TreeNode[] {
  const idSet = new Set(placed.map((t) => t.id));
  const childrenMap = new Map<string, TeamCatalogItem[]>();
  const roots: TeamCatalogItem[] = [];

  for (const team of placed) {
    const validParents = team.parentIds.filter((pid) => idSet.has(pid));
    if (validParents.length === 0) {
      roots.push(team);
    } else {
      for (const parentId of validParents) {
        if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
        childrenMap.get(parentId)!.push(team);
      }
    }
  }

  function makeNode(team: TeamCatalogItem, parentId: string | null, visited: Set<string>): TreeNode {
    if (visited.has(team.id)) {
      return { team, parentId, children: [] }; // cycle guard
    }
    const next = new Set(visited);
    next.add(team.id);
    return {
      team,
      parentId,
      children: (childrenMap.get(team.id) ?? [])
        .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        .map((child) => makeNode(child, team.id, next)),
    };
  }

  return roots
    .sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      return a.name.localeCompare(b.name, 'es');
    })
    .map((r) => makeNode(r, null, new Set()));
}

function getDescendantIds(teamId: string, catalog: TeamCatalogItem[]): Set<string> {
  const childrenMap = new Map<string, string[]>();
  for (const t of catalog) {
    for (const pid of t.parentIds) {
      if (!childrenMap.has(pid)) childrenMap.set(pid, []);
      childrenMap.get(pid)!.push(t.id);
    }
  }
  const desc = new Set<string>();
  const stack: string[] = [teamId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const cid of childrenMap.get(id) ?? []) {
      if (!desc.has(cid)) { desc.add(cid); stack.push(cid); }
    }
  }
  return desc;
}

// ── Empty state animation ─────────────────────────────────────────────────────

const GHOST_ROWS = [
  { pl: 1.5, barW: '52%', key: 'g0', delay: '0s'   },
  { pl: 4.5, barW: '40%', key: 'g1', delay: '0.7s' },
  { pl: 7.5, barW: '30%', key: 'g2', delay: '1.4s' },
  { pl: 4.5, barW: '38%', key: 'g3', delay: '2.1s' },
];

function EmptyTreeState({
  isOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  isOver: boolean;
  onDragOver: (e: DragEvent<HTMLElement>) => void;
  onDragLeave: (e: DragEvent<HTMLElement>) => void;
  onDrop: (e: DragEvent<HTMLElement>) => void;
}) {
  return (
    <Box
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      sx={{
        m: 2,
        borderRadius: 3,
        border: '2px dashed',
        borderColor: isOver ? 'primary.main' : 'primary.light',
        bgcolor: isOver ? 'primary.light' : 'transparent',
        transition: 'all 0.15s ease',
        overflow: 'hidden',
        ...(!isOver && {
          '@keyframes borderPulse': {
            '0%, 100%': { borderColor: 'rgba(124,58,237,0.25)' },
            '50%':       { borderColor: 'rgba(124,58,237,0.65)' },
          },
          animation: 'borderPulse 2.4s ease-in-out infinite',
        }),
      }}
    >
      <Box sx={{ textAlign: 'center', pt: 3, pb: 2, px: 2 }}>
        <AccountTreeIcon
          sx={{ fontSize: 44, color: isOver ? 'primary.main' : 'primary.light', mb: 1, transition: 'color 0.15s' }}
        />
        <Typography variant="body2" sx={{ fontWeight: 600, color: isOver ? 'primary.dark' : 'text.secondary' }}>
          {isOver ? '¡Soltá para agregar como raíz!' : 'Arrastrá el primer equipo aquí'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
          Empezá por el equipo padre principal
        </Typography>
      </Box>

      <Box sx={{ mx: 2, borderTop: '1px dashed', borderColor: 'divider', mb: 2 }} />

      <Box sx={{ px: 1.5, pb: 2.5 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', pl: 0.5, mb: 1, display: 'block' }}>
          Así se verá tu árbol:
        </Typography>
        {GHOST_ROWS.map(({ pl, barW, key, delay }) => (
          <Box
            key={key}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1, pl, py: 0.625,
              [`@keyframes ${key}`]: {
                '0%':   { opacity: 0 },
                '8%':   { opacity: 0.4 },
                '65%':  { opacity: 0.4 },
                '80%':  { opacity: 0 },
                '100%': { opacity: 0 },
              },
              opacity: 0,
              animation: `${key} 3.5s ease-in-out infinite`,
              animationDelay: delay,
              animationFillMode: 'backwards',
            }}
          >
            <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'grey.200', flexShrink: 0 }} />
            <Box sx={{ width: barW, height: 10, borderRadius: 1, bgcolor: 'grey.200' }} />
            <Box sx={{ width: 60, height: 10, borderRadius: 1, bgcolor: 'grey.100', ml: 'auto', flexShrink: 0 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ── Leadership legend ─────────────────────────────────────────────────────────

const LEADERSHIP_CHIP_SX = (mode: 'own' | 'inherit') => ({
  height: 18,
  fontSize: '0.65rem',
  flexShrink: 0,
  bgcolor:     mode === 'own' ? 'success.light' : 'info.light',
  color:       mode === 'own' ? 'success.dark'  : 'info.dark',
  border: '1px solid',
  borderColor: mode === 'own' ? 'success.main'  : 'info.main',
  '& .MuiChip-label': { px: 0.75 },
});

function LeadershipLegend() {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.25,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'grey.50',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
        Tipo de liderazgo
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Chip label="Propio" size="small" sx={LEADERSHIP_CHIP_SX('own')} />
        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
          El equipo tiene un rol líder asignado dentro de él.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Chip label="Heredado" size="small" sx={LEADERSHIP_CHIP_SX('inherit')} />
        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
          No tiene líderes propios y depende del liderazgo del equipo superior.
        </Typography>
      </Box>
    </Box>
  );
}

// ── DnD data encoding ─────────────────────────────────────────────────────────
// Chip drag:      "chip:{teamId}"
// Tree node drag: "node:{teamId}:{parentId|null}"

function encodeChipDrag(teamId: string) { return `chip:${teamId}`; }
function encodeNodeDrag(teamId: string, parentId: string | null) { return `node:${teamId}:${parentId ?? ''}`; }

function decodeDrag(raw: string): { kind: 'chip' | 'node'; teamId: string; parentId: string | null } | null {
  const parts = raw.split(':');
  if (parts[0] === 'chip' && parts.length >= 2) return { kind: 'chip', teamId: parts[1], parentId: null };
  if (parts[0] === 'node' && parts.length >= 3) return { kind: 'node', teamId: parts[1], parentId: parts[2] || null };
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  catalog: TeamCatalogItem[];
  onTeamChange: (id: string, changes: Partial<TeamCatalogItem>) => void;
}

const ROOT_DROP_ID = '__root__';

export function TeamHierarchyBuilder({ catalog, onTeamChange }: Props) {
  const [draggingId,    setDraggingId]    = useState<string | null>(null);
  const [overTarget,    setOverTarget]    = useState<string | null>(null);
  const [blockedTarget, setBlockedTarget] = useState<{ id: string; reason: string } | null>(null);

  const placedCatalog   = catalog.filter((t) => t.placed);
  const unplacedCatalog = catalog.filter((t) => !t.placed).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const placedSorted    = [...placedCatalog].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const idSet           = new Set(placedCatalog.map((t) => t.id));

  const tree = buildTree(placedCatalog);

  // ── DnD ──────────────────────────────────────────────────────────────────

  function startChipDrag(e: DragEvent<HTMLElement>, teamId: string) {
    e.dataTransfer.setData('text/plain', encodeChipDrag(teamId));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(teamId);
  }

  function startNodeDrag(e: DragEvent<HTMLElement>, teamId: string, parentId: string | null) {
    e.dataTransfer.setData('text/plain', encodeNodeDrag(teamId, parentId));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(teamId);
  }

  function onDragEnd() {
    setDraggingId(null);
    setOverTarget(null);
    setBlockedTarget(null);
  }

  function onDragOver(e: DragEvent<HTMLElement>, targetId: string) {
    e.preventDefault();
    e.stopPropagation();

    if (targetId === ROOT_DROP_ID || !draggingId) {
      e.dataTransfer.dropEffect = 'move';
      setOverTarget(targetId);
      setBlockedTarget(null);
      return;
    }

    // Check whether this drop would create a cycle
    const descendants = getDescendantIds(draggingId, catalog);
    if (descendants.has(targetId)) {
      e.dataTransfer.dropEffect = 'none';
      const sourceName = catalog.find((t) => t.id === draggingId)?.name ?? '';
      const targetName = catalog.find((t) => t.id === targetId)?.name  ?? '';
      setBlockedTarget({
        id: targetId,
        reason: `"${targetName}" ya está dentro de "${sourceName}" — colocarlo aquí generaría un ciclo jerárquico.`,
      });
      setOverTarget(null);
    } else {
      e.dataTransfer.dropEffect = 'move';
      setOverTarget(targetId);
      setBlockedTarget(null);
    }
  }

  function onDragLeave(e: DragEvent<HTMLElement>, targetId: string) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setOverTarget((prev)    => (prev === targetId       ? null : prev));
      setBlockedTarget((prev) => (prev?.id === targetId  ? null : prev));
    }
  }

  function onDrop(e: DragEvent<HTMLElement>, targetId: string) {
    e.preventDefault();
    e.stopPropagation();
    const info = decodeDrag(e.dataTransfer.getData('text/plain'));
    setDraggingId(null);
    setOverTarget(null);
    setBlockedTarget(null);
    if (!info) return;

    const { kind, teamId: sourceId, parentId: oldParentId } = info;
    if (sourceId === targetId) return;

    const sourceCatalog = catalog.find((t) => t.id === sourceId);
    if (!sourceCatalog) return;

    if (targetId === ROOT_DROP_ID) {
      if (kind === 'chip') {
        // Place as root (no parents)
        onTeamChange(sourceId, { placed: true, parentIds: [] });
      } else {
        // Tree node drag → remove the specific parent it was dragged from
        const newParents = sourceCatalog.parentIds.filter((pid) => pid !== oldParentId);
        onTeamChange(sourceId, { placed: newParents.length > 0 || true, parentIds: newParents });
      }
      return;
    }

    // Validate target is placed
    const target = catalog.find((t) => t.id === targetId);
    if (!target?.placed) return;

    // Prevent cycles
    const descendants = getDescendantIds(sourceId, catalog);
    if (descendants.has(targetId)) return;

    if (kind === 'chip') {
      // Chip drag: ADD this target as a new parent (multi-parent allowed)
      const existing = sourceCatalog.parentIds;
      if (existing.includes(targetId)) return; // already a parent
      onTeamChange(sourceId, { placed: true, parentIds: [...existing, targetId] });
    } else {
      // Node drag: REPLACE the old parent with the new one (move within tree)
      const newParents = sourceCatalog.parentIds.filter((pid) => pid !== oldParentId);
      if (!newParents.includes(targetId)) newParents.push(targetId);
      onTeamChange(sourceId, { placed: true, parentIds: newParents });
    }
  }

  /** Remove one specific parent relationship from a team. */
  function removeParent(teamId: string, parentId: string | null) {
    const team = catalog.find((t) => t.id === teamId);
    if (!team) return;

    if (parentId === null) {
      // Remove from roots → remove from tree entirely if no other parents
      if (team.parentIds.length === 0) {
        onTeamChange(teamId, { placed: false, parentIds: [] });
      }
      return;
    }

    const newParents = team.parentIds.filter((pid) => pid !== parentId);
    if (newParents.length === 0) {
      // Last parent removed → remove from tree
      // Detach placed children whose only parent is this team → make them roots
      catalog
        .filter((t) => t.placed && t.parentIds.length === 1 && t.parentIds[0] === teamId)
        .forEach((child) => onTeamChange(child.id, { parentIds: [] }));
      onTeamChange(teamId, { placed: false, parentIds: [] });
    } else {
      onTeamChange(teamId, { parentIds: newParents });
    }
  }

  // ── Tree node renderer ────────────────────────────────────────────────────

  function renderNode(node: TreeNode, depth: number): React.ReactNode {
    const { team, parentId } = node;
    const isOver     = overTarget === team.id;
    const isBlocked  = blockedTarget?.id === team.id;
    const isDragging = draggingId === team.id;

    // Count how many branches this team appears in
    const branchCount = team.parentIds.filter((pid) => idSet.has(pid)).length
      || (team.parentIds.length === 0 ? 1 : 0); // root counts as 1

    const isShared = branchCount > 1;

    const nodeBgColor =
      isBlocked ? 'error.light'   :
      isOver    ? 'primary.light' :
      isShared  ? 'warning.light' : 'transparent';

    const nodeOutlineColor =
      isBlocked ? 'error.main'   :
      isOver    ? 'primary.main' :
      isShared  ? 'warning.main' : 'transparent';

    return (
      <Box key={`${team.id}-${parentId ?? 'root'}`}>
        <Box
          draggable
          onDragStart={(e) => { e.stopPropagation(); startNodeDrag(e, team.id, parentId); }}
          onDragEnd={onDragEnd}
          onDragOver={(e) => onDragOver(e, team.id)}
          onDragLeave={(e) => onDragLeave(e, team.id)}
          onDrop={(e) => onDrop(e, team.id)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            pl: depth === 0 ? 1 : depth * 2.5 + 0.5,
            pr: 0.5,
            py: 0.625,
            borderRadius: 2,
            opacity: isDragging ? 0.3 : 1,
            bgcolor: nodeBgColor,
            outline: '2px solid',
            outlineColor: nodeOutlineColor,
            cursor: isBlocked ? 'not-allowed' : 'grab',
            transition: 'background-color 0.12s, outline-color 0.12s',
            userSelect: 'none',
            '&:hover': { bgcolor: nodeBgColor !== 'transparent' ? nodeBgColor : 'action.hover' },
            '&:hover .remove-btn': { opacity: 1 },
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />

          <Typography
            variant="body2"
            sx={{
              flex: 1,
              fontWeight: team.isMain ? 700 : 400,
              fontSize: depth > 0 ? '0.8125rem' : '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: team.isMain ? 'primary.dark' : 'text.primary',
            }}
          >
            {team.name}
          </Typography>

          {/* Multi-parent badge */}
          {isShared && (
            <Tooltip title={`Este equipo aparece en ${branchCount} ramas del árbol`} arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                <CallSplitIcon sx={{ fontSize: 13, color: 'warning.dark' }} />
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'warning.dark', fontWeight: 700, lineHeight: 1 }}>
                  {branchCount}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {!team.valid && (
            <Tooltip title={team.errors.join(' · ')} arrow>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', flexShrink: 0 }} />
            </Tooltip>
          )}

          {/* Leadership mode toggle chip */}
          <Tooltip
            title={
              team.leadershipMode === 'own'
                ? 'Liderazgo propio: tiene un rol líder asignado. Clic para cambiar a Heredado.'
                : 'Liderazgo heredado: depende del equipo superior. Clic para cambiar a Propio.'
            }
            arrow
            placement="top"
          >
            <Chip
              label={team.leadershipMode === 'own' ? 'Propio' : 'Heredado'}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onTeamChange(team.id, {
                  leadershipMode: team.leadershipMode === 'own' ? 'inherit' : 'own',
                });
              }}
              sx={{
                ...LEADERSHIP_CHIP_SX(team.leadershipMode),
                cursor: 'pointer',
                height: 20,
                transition: 'background-color 0.15s, color 0.15s',
                '&:hover': {
                  bgcolor: team.leadershipMode === 'own' ? 'success.main' : 'info.main',
                  color: '#fff',
                },
              }}
            />
          </Tooltip>

          <Tooltip title={team.isMain ? 'Quitar como principal' : 'Marcar como principal'} arrow>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onTeamChange(team.id, { isMain: !team.isMain }); }}
              sx={{ p: 0.25, flexShrink: 0 }}
            >
              {team.isMain
                ? <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                : <StarBorderIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title={isShared ? 'Quitar de esta rama' : 'Quitar del árbol'} arrow>
            <IconButton
              className="remove-btn"
              size="small"
              onClick={(e) => { e.stopPropagation(); removeParent(team.id, parentId); }}
              sx={{ p: 0.25, flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}
            >
              <CloseIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Blocked-drop message */}
        {isBlocked && blockedTarget && (
          <Box
            sx={{
              pl: depth === 0 ? 1 : depth * 2.5 + 0.5,
              pr: 1,
              pb: 0.75,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'error.main',
                fontSize: '0.72rem',
                lineHeight: 1.4,
                display: 'block',
              }}
            >
              ⚠ {blockedTarget.reason}
            </Typography>
          </Box>
        )}

        {node.children.length > 0 && (
          <Box sx={{ ml: depth === 0 ? 2.5 : depth * 2.5 + 1.5, borderLeft: '2px solid', borderColor: 'divider', pl: 0.5 }}>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </Box>
        )}
      </Box>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isEmptyTree = placedCatalog.length === 0;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 260px' }, gap: 2, alignItems: 'start' }}>

      {/* ── Left: hierarchy tree ── */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountTreeIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Árbol de jerarquías</Typography>
          {!isEmptyTree && (
            <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>
              {placedCatalog.length} equipo{placedCatalog.length !== 1 ? 's' : ''} · arrastrá para reorganizar
            </Typography>
          )}
        </Box>

        <LeadershipLegend />

        {isEmptyTree && (
          <EmptyTreeState
            isOver={overTarget === ROOT_DROP_ID}
            onDragOver={(e) => onDragOver(e, ROOT_DROP_ID)}
            onDragLeave={(e) => onDragLeave(e, ROOT_DROP_ID)}
            onDrop={(e) => onDrop(e, ROOT_DROP_ID)}
          />
        )}

        {!isEmptyTree && (
          <Box sx={{ p: 1.5 }}>
            {draggingId && (
              <Box
                onDragOver={(e) => onDragOver(e, ROOT_DROP_ID)}
                onDragLeave={(e) => onDragLeave(e, ROOT_DROP_ID)}
                onDrop={(e) => onDrop(e, ROOT_DROP_ID)}
                sx={{
                  mb: 1, p: 0.75, borderRadius: 2, border: '2px dashed', textAlign: 'center', transition: 'all 0.12s',
                  borderColor: overTarget === ROOT_DROP_ID ? 'primary.main' : 'divider',
                  bgcolor:     overTarget === ROOT_DROP_ID ? 'primary.light' : 'grey.50',
                }}
              >
                <Typography variant="caption" sx={{ color: overTarget === ROOT_DROP_ID ? 'primary.main' : 'text.disabled' }}>
                  Soltar aquí para hacer raíz
                </Typography>
              </Box>
            )}
            {tree.map((node) => renderNode(node, 0))}
          </Box>
        )}

        {/* Multi-parent legend */}
        {placedCatalog.some((t) => t.parentIds.filter((pid) => idSet.has(pid)).length > 1) && (
          <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <CallSplitIcon sx={{ fontSize: 14, color: 'warning.dark' }} />
            <Typography variant="caption" sx={{ color: 'warning.dark' }}>
              = equipo compartido en varias ramas
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ── Right: chips panel ── */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', position: { xs: 'static', md: 'sticky' }, top: 24 }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkspacesIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Equipos del archivo</Typography>
          <Chip label={catalog.length} size="small" sx={{ ml: 'auto', fontWeight: 600 }} />
        </Box>

        {/* Unplaced */}
        {unplacedCatalog.length > 0 && (
          <Box sx={{ px: 1.5, pt: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', pl: 0.25, mb: 0.75, display: 'block' }}>
              Sin ubicar ({unplacedCatalog.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {unplacedCatalog.map((team) => (
                <Chip
                  key={team.id}
                  draggable
                  label={team.name}
                  size="small"
                  variant="outlined"
                  onDragStart={(e) => startChipDrag(e, team.id)}
                  onDragEnd={onDragEnd}
                  sx={{
                    cursor: 'grab',
                    opacity: draggingId === team.id ? 0.35 : 1,
                    fontSize: '0.75rem',
                    borderColor: !team.valid ? 'error.light' : undefined,
                    transition: 'opacity 0.12s',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Placed */}
        {placedSorted.length > 0 && (
          <Box sx={{ px: 1.5, pt: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', pl: 0.25, mb: 0.75, display: 'block' }}>
              En el árbol ({placedSorted.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {placedSorted.map((team) => {
                const validParents = team.parentIds.filter((pid) => idSet.has(pid));
                const parentNames  = validParents.map((pid) => catalog.find((t) => t.id === pid)?.name ?? pid);
                const branchCount  = validParents.length || 1;
                const isShared     = branchCount > 1;
                const tooltipText  = parentNames.length > 0
                  ? `Hijo de: ${parentNames.join(', ')}`
                  : 'Equipo raíz';

                return (
                  <Tooltip key={team.id} title={tooltipText} arrow placement="top">
                    <Chip
                      draggable
                      label={isShared ? `${team.name} ×${branchCount}` : team.name}
                      size="small"
                      color={isShared ? 'warning' : team.isMain ? 'primary' : 'default'}
                      variant="filled"
                      onDragStart={(e) => startChipDrag(e, team.id)}
                      onDragEnd={onDragEnd}
                      sx={{
                        cursor: 'grab',
                        opacity: draggingId === team.id ? 0.35 : 0.72,
                        fontWeight: team.isMain || isShared ? 700 : 400,
                        fontSize: '0.75rem',
                        transition: 'opacity 0.12s',
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        )}

        <Box sx={{ px: 1.5, pt: 1.5, pb: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Chip → árbol: agrega rama · Nodo → nodo: mueve
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
