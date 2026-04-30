export const NONE_VALUE = '__none__';

export const STEP_LABELS: Record<number, string> = {
  1: 'Miembros',
  2: 'Roles',
  3: 'Equipos',
  4: 'Puestos',
  5: 'Líderes',
};

export const WORK_MODE_VALUES = ['Presencial', 'Híbrido', 'Remoto'] as const;
export type WorkModeValue = (typeof WORK_MODE_VALUES)[number];

export const ROLE_COLUMN_ALIASES = ['rol', 'role', 'puesto', 'cargo', 'funcion', 'función', 'job title', 'position'];
export const TEAM_COLUMN_ALIASES = ['equipo', 'team', 'area', 'área', 'sector', 'departamento', 'department'];

export const MAX_PREVIEW_ROWS = 8;
export const MAX_PREVIEW_COLS = 8;
export const MAX_DISTINCT_VALUES = 50;
export const ROW_EDITOR_FALLBACK_COUNT = 10;

export const SCORE_EXACT = 120;
export const SCORE_CONTAINS = 80;
