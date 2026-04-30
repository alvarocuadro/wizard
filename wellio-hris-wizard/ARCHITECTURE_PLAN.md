# ARCHITECTURE_PLAN.md
## SKILL #2 — Wellio HRIS Wizard

---

## 1. ÁRBOL DE COMPONENTES

```
App
└── ThemeProvider (MUI)
    └── LocalizationProvider (dayjs, es-AR)
        └── WizardProvider (Context API)
            └── WizardLayout
                ├── WizardHeader
                │   ├── WizardTitle ("Carga inicial")
                │   └── StepperPills
                │       └── StepPill × 5 (active / done / default)
                └── WizardContent
                    ├── Step1Panel
                    │   ├── TwoColumnGrid
                    │   │   ├── [col-left] MappingCard
                    │   │   │   ├── CardHeader (title + ProgressBadge)
                    │   │   │   ├── FileUploadZone
                    │   │   │   ├── MappingToolbar
                    │   │   │   │   ├── SearchInput
                    │   │   │   │   ├── RedetectButton
                    │   │   │   │   ├── ValidateButton (loader)
                    │   │   │   │   └── ExportJsonButton
                    │   │   │   ├── FieldMappingGrid
                    │   │   │   │   └── FieldMappingCard × 20
                    │   │   │   │       └── WorkModeAliasRows (condicional)
                    │   │   │   ├── ValidationSummaryBanner
                    │   │   │   ├── ValidationActions
                    │   │   │   │   ├── DownloadValidButton (loader)
                    │   │   │   │   └── DownloadErrorsButton (loader)
                    │   │   │   └── RowEditorSection
                    │   │   │       └── RowEditorCard × N
                    │   │   └── [col-right] PreviewCard
                    │   │       ├── PreviewChipsStack
                    │   │       │   └── PreviewFieldBox × 5 (preview fields)
                    │   │       └── DataPreviewTable
                    │   └── StepNavigation (solo "Continuar")
                    ├── Step2Panel
                    │   ├── SourceFileChoice
                    │   ├── FileUploadZone (si mode=other)
                    │   ├── ColumnMappingCard (columna de Rol)
                    │   ├── RoleListSection
                    │   │   ├── ValidationSummaryBanner
                    │   │   └── RoleListItem × N
                    │   └── StepNavigation ("Volver" + "Continuar")
                    ├── Step3Panel
                    │   ├── SourceFileChoice
                    │   ├── FileUploadZone (si mode=other)
                    │   ├── ColumnMappingCard (columna de Equipo)
                    │   ├── TeamListSection
                    │   │   ├── ValidationSummaryBanner
                    │   │   ├── TeamListItem × N
                    │   │   └── TeamTreePreview
                    │   └── StepNavigation ("Volver" + "Continuar")
                    ├── Step4Panel
                    │   ├── SourceFileChoice
                    │   ├── FileUploadZone (si mode=other)
                    │   ├── AssignmentMappingRow (3 ColumnMappingCard en fila)
                    │   ├── AssignmentListSection
                    │   │   ├── ValidationSummaryBanner
                    │   │   └── AssignmentListItem × N
                    │   └── StepNavigation ("Volver" + "Continuar")
                    └── Step5Panel
                        ├── ValidationSummaryBanner
                        ├── LeaderAssignmentList
                        │   └── LeaderAssignmentItem × N
                        ├── StepNavigation ("Volver" + "Finalizar")
                        └── JsonOutputModal
```

---

## 2. TYPESCRIPT INTERFACES COMPLETAS

### 2.1 Tipos primitivos y utilitarios

```typescript
// src/utils/types.ts

export type CellValue = string | number | boolean | Date | null | undefined;
export type SourceMode = 'same' | 'other';
export type LeadershipMode = 'own' | 'inherit';
export type StepNumber = 1 | 2 | 3 | 4 | 5;
export type FieldType = 'text' | 'email' | 'date' | 'enum';
export type BadgeStatus = 'ok' | 'warn' | 'error' | 'secondary';

export interface WorkModeValueMap {
  Presencial: string;
  Híbrido: string;
  Remoto: string;
}
```

### 2.2 Definición de campos (FIELDS)

```typescript
// src/utils/fields.ts

export interface WizardField {
  key: string;
  label: string;
  required: boolean;
  maxLength?: number;
  type: FieldType;
  enumValues?: string[];
  aliases: string[];
  preview?: boolean;
}

export const FIELDS: WizardField[] = [
  // 5 obligatorios + 15 opcionales (ver REQUIREMENTS_ANALYSIS.md §3.2)
];
```

### 2.3 Estado del Paso 1

```typescript
// src/context/types/step1.types.ts

export interface FileParseResult {
  fileName: string;
  headers: string[];
  rows: CellValue[][];
}

export interface FieldMapping {
  [fieldKey: string]: string; // valor: header name | '__none__'
}

export interface RowMeta {
  [key: string]: string | boolean | null;
}

export interface NormalizedRow {
  [fieldKey: string]: string;
}

export interface ValidationResult {
  rowNumber: number;
  raw: CellValue[];
  normalized: NormalizedRow;
  meta: RowMeta;
  errors: string[];
  valid: boolean;
  omitted: boolean;
}

export interface ProcessedRow {
  [label: string]: string; // keyed by field.label (para export CSV)
}

export interface Step1State {
  source: FileParseResult | null;
  mapping: FieldMapping;
  workModeValueMap: WorkModeValueMap;
  validationResults: ValidationResult[];
  processedRows: ProcessedRow[];
}
```

### 2.4 Tipos compartidos entre Pasos 2-4

```typescript
// src/context/types/shared.types.ts

export interface StepSourceData {
  mode: SourceMode;
  fileName: string;
  headers: string[];
  rows: CellValue[][];
}

export const EMPTY_SOURCE_DATA: StepSourceData = {
  mode: 'same',
  fileName: '',
  headers: [],
  rows: [],
};
```

### 2.5 Estado del Paso 2 (Roles)

```typescript
// src/context/types/step2.types.ts

export interface RoleCatalogItem {
  id: string;          // normalize(name)
  name: string;
  hasReports: boolean;
  errors: string[];
  valid: boolean;
}

export interface Step2State {
  sourceData: StepSourceData;
  selectedColumn: string; // '__none__' si no elegida
  catalog: RoleCatalogItem[];
}
```

### 2.6 Estado del Paso 3 (Equipos)

```typescript
// src/context/types/step3.types.ts

export interface TeamCatalogItem {
  id: string;           // normalize(name)
  name: string;
  isMain: boolean;
  leadershipMode: LeadershipMode;
  parentIds: string[];  // array de team.id
  errors: string[];
  valid: boolean;
}

export interface Step3State {
  sourceData: StepSourceData;
  selectedColumn: string;
  catalog: TeamCatalogItem[];
}
```

### 2.7 Estado del Paso 4 (Puestos)

```typescript
// src/context/types/step4.types.ts

export interface AssignmentColumnMapping {
  member: string; // header name | '__none__'
  role: string;
  team: string;
}

export interface AssignmentItem {
  sourceRow: number;
  member: string;
  role: string;
  team: string;
  errors: string[];
  valid: boolean;
}

export interface Step4State {
  sourceData: StepSourceData;
  columnMapping: AssignmentColumnMapping;
  catalog: AssignmentItem[];
}
```

### 2.8 Estado del Paso 5 (Líderes)

```typescript
// src/context/types/step5.types.ts

export interface LeaderAssignment {
  teamId: string;
  teamName: string;
  leaderRole: string;
  leaderPerson: string;
  candidates: AssignmentItem[]; // computed desde Step4
  errors: string[];
  valid: boolean;
}

export interface Step5State {
  assignments: LeaderAssignment[];
}
```

### 2.9 JSON de salida

```typescript
// src/utils/types.ts (continuación)

export interface MemberRef {
  name: string;
  lastName: string;
}

export interface RoleGroup {
  roleTypeId: string;
  members: MemberRef[];
  teamId: string;
  isTeamLead: boolean;
  minQty: number;
  maxQty: number;
  parentsRolesId: string[];
}

export interface TeamOutput {
  name: string;
  childrenTeams: string[];
  parentsTeamsId?: string[];
  roles: RoleGroup[];
}

export interface FinalOutput {
  teams: TeamOutput[];
}
```

### 2.10 Estado global del Wizard

```typescript
// src/context/WizardContext.tsx

export interface WizardState {
  currentStep: StepNumber;
  step1: Step1State;
  step2: Step2State;
  step3: Step3State;
  step4: Step4State;
  step5: Step5State;
}

export type WizardAction =
  | { type: 'GO_TO_STEP'; payload: StepNumber }
  // Step 1
  | { type: 'S1_SET_SOURCE'; payload: FileParseResult }
  | { type: 'S1_SET_MAPPING'; payload: FieldMapping }
  | { type: 'S1_SET_WORKMODE_MAP'; payload: WorkModeValueMap }
  | { type: 'S1_SET_VALIDATION'; payload: { results: ValidationResult[]; processedRows: ProcessedRow[] } }
  | { type: 'S1_UPDATE_ROW'; payload: { index: number; normalized: NormalizedRow } }
  | { type: 'S1_TOGGLE_OMIT'; payload: number }
  | { type: 'S1_RESET_VALIDATION' }
  // Step 2
  | { type: 'S2_SET_SOURCE_DATA'; payload: StepSourceData }
  | { type: 'S2_SET_COLUMN'; payload: string }
  | { type: 'S2_SET_CATALOG'; payload: RoleCatalogItem[] }
  | { type: 'S2_UPDATE_ROLE'; payload: { id: string; changes: Partial<RoleCatalogItem> } }
  // Step 3
  | { type: 'S3_SET_SOURCE_DATA'; payload: StepSourceData }
  | { type: 'S3_SET_COLUMN'; payload: string }
  | { type: 'S3_SET_CATALOG'; payload: TeamCatalogItem[] }
  | { type: 'S3_UPDATE_TEAM'; payload: { id: string; changes: Partial<TeamCatalogItem> } }
  // Step 4
  | { type: 'S4_SET_SOURCE_DATA'; payload: StepSourceData }
  | { type: 'S4_SET_COLUMN_MAPPING'; payload: AssignmentColumnMapping }
  | { type: 'S4_SET_CATALOG'; payload: AssignmentItem[] }
  | { type: 'S4_UPDATE_ASSIGNMENT'; payload: { index: number; changes: Partial<AssignmentItem> } }
  // Step 5
  | { type: 'S5_SET_ASSIGNMENTS'; payload: LeaderAssignment[] }
  | { type: 'S5_UPDATE_ASSIGNMENT'; payload: { teamId: string; changes: Partial<LeaderAssignment> } }
  // Reset
  | { type: 'RESET_FROM_STEP'; payload: StepNumber };

export interface WizardContextValue {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
}
```

---

## 3. ESTRATEGIA DE ESTADO (CONTEXT API + REDUCER)

### 3.1 Patrón

```
WizardProvider
  ├── useReducer(wizardReducer, initialState)
  ├── Provee { state, dispatch } vía Context
  └── NO provee hooks derivados — esos se construyen sobre useContext
```

### 3.2 Separación de responsabilidades

| Capa | Responsabilidad |
|------|----------------|
| `WizardContext` | Estado bruto + dispatch |
| Custom hooks | Lógica derivada, cálculos, side effects |
| Componentes | Solo lectura de estado + dispatch de acciones simples |

### 3.3 Estado inicial

```typescript
const initialState: WizardState = {
  currentStep: 1,
  step1: { source: null, mapping: {}, workModeValueMap: { Presencial: '', Híbrido: '', Remoto: '' }, validationResults: [], processedRows: [] },
  step2: { sourceData: EMPTY_SOURCE_DATA, selectedColumn: '__none__', catalog: [] },
  step3: { sourceData: EMPTY_SOURCE_DATA, selectedColumn: '__none__', catalog: [] },
  step4: { sourceData: EMPTY_SOURCE_DATA, columnMapping: { member: '__none__', role: '__none__', team: '__none__' }, catalog: [] },
  step5: { assignments: [] },
};
```

### 3.4 Acción RESET_FROM_STEP

Al cambiar archivo en cualquier paso, se resetean todos los pasos dependientes:

```
RESET_FROM_STEP(1) → resetea step2, step3, step4, step5
RESET_FROM_STEP(2) → resetea step3, step4, step5
RESET_FROM_STEP(3) → resetea step4, step5
RESET_FROM_STEP(4) → resetea step5
```

---

## 4. CUSTOM HOOKS

### 4.1 `useFileParser`

```typescript
// src/hooks/useFileParser.ts
interface UseFileParserReturn {
  parse: (file: File) => Promise<FileParseResult>;
  loading: boolean;
  error: string | null;
}
```

**Responsabilidad:** Parsear `.xlsx`, `.xls`, `.csv` con SheetJS. Detectar primera fila no vacía como headers. Devolver `{ fileName, headers, rows }`.

### 4.2 `useColumnDetection`

```typescript
// src/hooks/useColumnDetection.ts
interface UseColumnDetectionReturn {
  detectMappings: (headers: string[]) => FieldMapping;
  detectSingleColumn: (headers: string[], aliases: string[]) => string;
  detectAssignmentColumns: (headers: string[]) => AssignmentColumnMapping;
}
```

**Responsabilidad:** Algoritmo de scoring para detectar columnas por alias. Prevenir asignación duplicada de columnas.

### 4.3 `useRowValidation`

```typescript
// src/hooks/useRowValidation.ts
interface UseRowValidationReturn {
  validateAll: (rows: CellValue[][], mapping: FieldMapping, workModeMap: WorkModeValueMap) => ValidationResult[];
  validateSingle: (normalized: NormalizedRow) => string[];
  normalizeRow: (row: CellValue[], mapping: FieldMapping, headers: string[], workModeMap: WorkModeValueMap) => { normalized: NormalizedRow; meta: RowMeta };
}
```

**Responsabilidad:** Normalización de fechas, workMode y texto. Validación contra reglas de campos. Incluye función de normalización de fechas (7 formatos).

### 4.4 `useRolesCatalog`

```typescript
// src/hooks/useRolesCatalog.ts
interface UseRolesCatalogReturn {
  catalog: RoleCatalogItem[];
  buildFromRows: (rows: CellValue[][], headers: string[], column: string) => void;
  updateRole: (id: string, changes: Partial<RoleCatalogItem>) => void;
  hasErrors: boolean;
  summary: { total: number; valid: number; invalid: number };
}
```

**Responsabilidad:** Deduplicar roles, validar nombres, preservar ediciones previas al cambiar columna.

### 4.5 `useTeamsCatalog`

```typescript
// src/hooks/useTeamsCatalog.ts
interface UseTeamsCatalogReturn {
  catalog: TeamCatalogItem[];
  buildFromRows: (rows: CellValue[][], headers: string[], column: string) => void;
  updateTeam: (id: string, changes: Partial<TeamCatalogItem>) => void;
  hasLoop: boolean;
  hasErrors: boolean;
  treeLines: string[];
  summary: { total: number; valid: number; invalid: number; mainCount: number; hasLoop: boolean };
}
```

**Responsabilidad:** Deduplicar equipos, DFS para detección de loops, construir preview ASCII del árbol, preservar ediciones al cambiar columna.

### 4.6 `useAssignmentsCatalog`

```typescript
// src/hooks/useAssignmentsCatalog.ts
interface UseAssignmentsCatalogReturn {
  catalog: AssignmentItem[];
  buildFromRows: (rows: CellValue[][], headers: string[], colMapping: AssignmentColumnMapping, step1State: Step1State) => void;
  updateAssignment: (index: number, changes: Partial<AssignmentItem>) => void;
  knownMembers: string[];     // lista ordenada A-Z del Paso 1
  hasErrors: boolean;
  summary: { total: number; valid: number; invalid: number };
}
```

**Responsabilidad:** Construir asociaciones, reconstruir nombre completo desde Paso 1, validación cruzada con catálogos 2 y 3.

### 4.7 `useLeadersCatalog`

```typescript
// src/hooks/useLeadersCatalog.ts
interface UseLeadersCatalogReturn {
  assignments: LeaderAssignment[];
  buildFromStep3And4: (teams: TeamCatalogItem[], assignments: AssignmentItem[]) => void;
  updateAssignment: (teamId: string, changes: Partial<LeaderAssignment>) => void;
  hasErrors: boolean;
  summary: { total: number; valid: number; invalid: number };
}
```

**Responsabilidad:** Filtrar equipos con `leadershipMode=own`, construir candidatos por equipo, validar combinación role+person, filtrar personas al cambiar rol.

### 4.8 `useWizardNavigation`

```typescript
// src/hooks/useWizardNavigation.ts
interface UseWizardNavigationReturn {
  currentStep: StepNumber;
  canAdvance: boolean;    // evaluado con reglas de bloqueo
  blockReason: string;    // texto explicativo del bloqueo
  goNext: () => void;
  goBack: () => void;
  goTo: (step: StepNumber) => void;
}
```

**Responsabilidad:** Evaluar condiciones de bloqueo por paso (ver §9.3 de REQUIREMENTS), ejecutar transiciones.

### 4.9 `useFinalJsonBuilder`

```typescript
// src/hooks/useFinalJsonBuilder.ts
interface UseFinalJsonBuilderReturn {
  build: () => FinalOutput;
  json: string;           // JSON.stringify formateado
  copyToClipboard: () => Promise<void>;
  copied: boolean;
}
```

**Responsabilidad:** Construir el JSON final desde los catálogos de Pasos 3, 4 y 5. Resolver `childrenTeams`, `parentsTeamsId`, `roles`, `isTeamLead`, `parentsRolesId`.

### 4.10 `useDataTable` (SKILL #5)

```typescript
// src/hooks/useDataTable.ts
interface UseDataTableOptions<T> {
  data: T[];
  columns: MRT_ColumnDef<T>[];
  enablePagination?: boolean;
}
interface UseDataTableReturn<T> {
  table: MRT_TableInstance<T>;
}
```

**Responsabilidad:** Configurar Material React Table con `filterFn: 'includesString'`, `globalFilterFn: 'includesString'`, sorting correcto para números y fechas DD/MM/AAAA, deshabilitar filtro/sort en columna Acciones.

---

## 5. ESTRUCTURA DE ARCHIVOS

```
wellio-hris-wizard/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── theme/
│   │   ├── theme.ts              # MUI ThemeOptions
│   │   ├── colors.ts             # Constantes de color Wellio
│   │   └── wellioTokens.ts       # Tokens como JS object
│   │
│   ├── utils/
│   │   ├── types.ts              # Tipos globales y JSON output
│   │   ├── fields.ts             # FIELDS array (20 campos)
│   │   ├── normalize.ts          # Función normalize()
│   │   ├── validators.ts         # validateRequired, validateName, etc.
│   │   └── constants.ts          # __NONE__, STEP_LABELS, etc.
│   │
│   ├── context/
│   │   ├── WizardContext.tsx     # createContext + WizardProvider
│   │   ├── wizardReducer.ts      # reducer puro
│   │   ├── initialState.ts       # Estado inicial
│   │   └── types/
│   │       ├── step1.types.ts
│   │       ├── step2.types.ts
│   │       ├── step3.types.ts
│   │       ├── step4.types.ts
│   │       ├── step5.types.ts
│   │       └── shared.types.ts
│   │
│   ├── hooks/
│   │   ├── useWizardContext.ts   # Wrapper de useContext con null-check
│   │   ├── useFileParser.ts
│   │   ├── useColumnDetection.ts
│   │   ├── useRowValidation.ts
│   │   ├── useRolesCatalog.ts
│   │   ├── useTeamsCatalog.ts
│   │   ├── useAssignmentsCatalog.ts
│   │   ├── useLeadersCatalog.ts
│   │   ├── useWizardNavigation.ts
│   │   ├── useFinalJsonBuilder.ts
│   │   └── useDataTable.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── DataTable.tsx
│   │   │   ├── CrudModal.tsx
│   │   │   ├── ConfirmDeleteModal.tsx
│   │   │   ├── DatePickerES.tsx
│   │   │   ├── SelectAlphabetic.tsx
│   │   │   ├── AutocompleteAlphabetic.tsx
│   │   │   ├── FileUploadZone.tsx
│   │   │   ├── ValidationSummaryBanner.tsx
│   │   │   ├── CharCounterInput.tsx
│   │   │   └── JsonPreviewModal.tsx
│   │   │
│   │   └── wizard/
│   │       ├── WizardLayout.tsx
│   │       ├── WizardHeader.tsx
│   │       ├── StepperPills.tsx
│   │       ├── StepNavigation.tsx
│   │       └── SourceFileChoice.tsx
│   │
│   ├── features/
│   │   ├── step1/
│   │   │   ├── Step1Panel.tsx
│   │   │   ├── FieldMappingGrid.tsx
│   │   │   ├── FieldMappingCard.tsx
│   │   │   ├── WorkModeAliasRows.tsx
│   │   │   ├── MappingToolbar.tsx
│   │   │   ├── DataPreviewPanel.tsx
│   │   │   ├── PreviewChipsStack.tsx
│   │   │   ├── DataPreviewTable.tsx
│   │   │   ├── ValidationSummaryBanner.tsx (re-export)
│   │   │   ├── RowEditorSection.tsx
│   │   │   └── RowEditorCard.tsx
│   │   │
│   │   ├── step2/
│   │   │   ├── Step2Panel.tsx
│   │   │   ├── ColumnMappingCard.tsx
│   │   │   ├── RoleListSection.tsx
│   │   │   └── RoleListItem.tsx
│   │   │
│   │   ├── step3/
│   │   │   ├── Step3Panel.tsx
│   │   │   ├── ColumnMappingCard.tsx (re-export o variante)
│   │   │   ├── TeamListSection.tsx
│   │   │   ├── TeamListItem.tsx
│   │   │   └── TeamTreePreview.tsx
│   │   │
│   │   ├── step4/
│   │   │   ├── Step4Panel.tsx
│   │   │   ├── AssignmentMappingRow.tsx
│   │   │   ├── AssignmentListSection.tsx
│   │   │   └── AssignmentListItem.tsx
│   │   │
│   │   └── step5/
│   │       ├── Step5Panel.tsx
│   │       ├── LeaderAssignmentList.tsx
│   │       ├── LeaderAssignmentItem.tsx
│   │       └── JsonOutputModal.tsx
│   │
│   └── assets/
│       └── (logo, etc.)
│
├── src/__tests__/
│   ├── validators.test.ts
│   ├── normalize.test.ts
│   ├── useRowValidation.test.ts
│   ├── useTeamsCatalog.test.ts   # DFS loop detection
│   └── useFinalJsonBuilder.test.ts
│
├── REQUIREMENTS_ANALYSIS.md
├── ARCHITECTURE_PLAN.md
├── package.json
├── tsconfig.app.json
└── vite.config.ts
```

---

## 6. MAPEO COMPONENTE → REGLAS UX/UI

| Componente | Reglas UX/UI aplicables |
|-----------|------------------------|
| `FieldMappingGrid` | Badge por campo (OK/Requerido/Opcional), columna usada → deshabilitar en otros selects |
| `FieldMappingCard` | WorkMode: sub-selects de alias por valor canónico |
| `CharCounterInput` | Contador "X/MAX caracteres", error si supera |
| `RoleListItem` | Orden A-Z, contador X/40, error inline en tiempo real |
| `TeamListItem` | Orden A-Z padres, contador X/40, validación in-line |
| `TeamTreePreview` | Actualización on-change, "Configuración inválida" si hay loop |
| `AssignmentListItem` | Selects rol/equipo ordenados A-Z, datalist miembros |
| `LeaderAssignmentItem` | Select rol → filtra personas, ambos A-Z |
| `StepNavigation` | "Continuar" deshabilitado si `canAdvance=false` + tooltip con razón |
| `FileUploadZone` | Skeleton loader mientras parsea |
| `ValidationSummaryBanner` | Resumen inline (total/válidas/errores/omitidas) |
| `RowEditorCard` | Loader en "Revalidar fila", badge de estado |
| `DownloadButton` | Loader mientras genera/descarga CSV |
| `JsonOutputModal` | Modal con JSON formateado, botón "Copiar al portapapeles" con loader |
| `SelectAlphabetic` | Items `sort((a,b) => a.localeCompare(b, 'es'))` |
| `DataTable` | `filterFn: 'includesString'`, Acciones no filtrable/sorteable |

---

## 7. TIMELINE DE DESARROLLO (con dependencias)

### Fase 0 — Setup (bloquea todo lo demás)
```
[ ] Instalar dependencias (@mui, @emotion, xlsx, dayjs, material-react-table, vitest)
[ ] Configurar tsconfig (strict)
[ ] Configurar vite.config.ts para vitest
```

### Fase 1 — Fundación (paralelo, bloquea Fase 2)
```
SKILL #3: [ ] theme.ts + colors.ts + wellioTokens.ts
SKILL #4: [ ] validators.ts + normalize.ts + fields.ts + tests
           [ ] types.ts + constants.ts
           [ ] WizardContext + wizardReducer + initialState
```

### Fase 2 — Componentes genéricos (paralelo entre sí, bloquea Fase 3)
```
SKILL #5: [ ] useDataTable.ts + DataTable.tsx
SKILL #6: [ ] CrudModal.tsx + ConfirmDeleteModal.tsx
SKILL #7: [ ] DatePickerES.tsx
SKILL #8: [ ] SelectAlphabetic.tsx + AutocompleteAlphabetic.tsx
           [ ] FileUploadZone.tsx
           [ ] ValidationSummaryBanner.tsx
           [ ] CharCounterInput.tsx
           [ ] JsonPreviewModal.tsx
           [ ] WizardLayout + WizardHeader + StepperPills + StepNavigation
```

### Fase 3 — Hooks de dominio (algunos en paralelo)
```
[ ] useFileParser.ts           (independiente)
[ ] useColumnDetection.ts      (independiente)
[ ] useRowValidation.ts        (depende de validators.ts)
[ ] useWizardNavigation.ts     (depende de context)
[ ] useRolesCatalog.ts         (depende de normalize)
[ ] useTeamsCatalog.ts         (depende de normalize — DFS)
[ ] useAssignmentsCatalog.ts   (depende de step1+step2+step3 state)
[ ] useLeadersCatalog.ts       (depende de step3+step4 state)
[ ] useFinalJsonBuilder.ts     (depende de step3+step4+step5 state)
```

### Fase 4 — Feature components (SECUENCIAL — cada paso depende del anterior)
```
SKILL #9:
[ ] Step1Panel + sub-componentes   (Paso 1 funcional completo)
[ ] Step2Panel + sub-componentes   (depende de Step1 data)
[ ] Step3Panel + sub-componentes   (depende de Step2 data)
[ ] Step4Panel + sub-componentes   (depende de Step2+Step3 data)
[ ] Step5Panel + sub-componentes   (depende de Step3+Step4 data)
[ ] JsonOutputModal                (depende de Step5 state)
```

### Fase 5 — Integración
```
SKILL #10:
[ ] Conectar WizardProvider con App
[ ] Flujo de navegación end-to-end
[ ] Tests de integración
[ ] Validación checklist UX/UI
```

---

## 8. DECISIONES ARQUITECTÓNICAS

### 8.1 ¿Por qué `useReducer` en lugar de múltiples `useState`?

El estado del wizard tiene interdependencias fuertes entre pasos (resetear pasos dependientes, actualizar catálogos al cambiar fuente). Un reducer centralizado hace las transiciones de estado predecibles y testables.

### 8.2 ¿Por qué hooks de dominio fuera del Context?

Los hooks (`useRolesCatalog`, `useTeamsCatalog`, etc.) encapsulan lógica compleja (DFS, scoring, normalización). Mantenerlos fuera del reducer permite:
- Testearlos en aislamiento
- Evitar lógica side-effect en el reducer (debe ser puro)
- Los hooks llaman `dispatch` cuando terminan su cálculo

### 8.3 ¿Por qué cards editables en vez de DataTable para Pasos 2-5?

El prototipo HTML usa listas de cards editables (no tablas). Los campos de cada ítem (nombre, checkbox, radio, selects de padres) requieren inputs interactivos que son incómodos en celdas de tabla. La DataTable genérica queda disponible para uso futuro (vistas de resumen).

### 8.4 ¿Por qué `normalize.ts` como utilitario independiente?

La función `normalize()` (quitar acentos, lowercase, quitar guiones) se usa en 4+ lugares distintos (scoring de columnas, deduplicación de roles, deduplicación de equipos, comparación cruzada). Un módulo independiente previene duplicación y facilita testing.

### 8.5 ¿Por qué SheetJS como paquete npm y no CDN?

El prototipo usa CDN. En un proyecto Vite+TypeScript con bundling, el paquete npm es lo correcto: tree-shaking, TypeScript types (`@types/xlsx` o tipos embebidos), sin dependencia de red externa.

---

## 9. RIESGOS IDENTIFICADOS

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Archivos Excel con múltiples hojas | Alto | Usar siempre `workbook.SheetNames[0]` |
| Archivos con filas vacías intercaladas | Alto | Filtrar `row.some(cell => cell !== '')` |
| DFS en grafos muy grandes (100+ equipos) | Medio | Algoritmo O(V+E) — aceptable para PoC |
| MUI DatePicker v7 con dayjs: locale ES | Medio | Usar `AdapterDayjs` + `import 'dayjs/locale/es'` |
| Material React Table v2 con React 19 | Medio | Verificar compatibilidad; usar `"react": "^18.0.0"` en peer deps si hay warning |
| Archivos CSV con encoding no-UTF8 | Bajo | SheetJS detecta automáticamente; documentar limitación |
| Deduplicación de roles/equipos por normalize: colisiones | Bajo | Si dos nombres normalizan igual, el primero gana — documentar |

---

## 10. CHECKLIST DE VALIDACIÓN — SKILL #2

- [x] Árbol de componentes completo (todos los pasos)
- [x] TypeScript interfaces completas (sin `any`)
- [x] Estrategia de estado documentada (Context API + useReducer)
- [x] Custom hooks con firma TypeScript
- [x] Mapeo componente → reglas UX/UI
- [x] Timeline con dependencias explícitas
- [x] Riesgos identificados
- [x] Decisiones arquitectónicas justificadas
- [x] Compatible con REQUIREMENTS_ANALYSIS.md
- [x] Reglas de bloqueo de navegación implementadas en `useWizardNavigation`
- [x] JSON de salida compatible con AF_Org.md

---

*Documento producido por SKILL #2 ARCHITECTURE — en espera de aprobación para continuar con Skills #3-8 (en paralelo).*
