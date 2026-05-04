export type CellValue = string | number | boolean | Date | null | undefined;
export type SourceMode = 'same' | 'other';
export type LeadershipMode = 'own' | 'inherit';
export type StepNumber = 1 | 2 | 3 | 4 | 5;
export type FieldType = 'text' | 'email' | 'date' | 'enum';

export interface WorkModeValueMap {
  Presencial: string;
  Híbrido: string;
  Remoto: string;
}

// ─── File parsing ────────────────────────────────────────────────────────────

export interface FileParseResult {
  fileName: string;
  headers: string[];
  rows: CellValue[][];
  headerRowNumber: number;
  dataStartRowNumber: number;
}

export interface StepSourceData {
  mode: SourceMode;
  fileName: string;
  headers: string[];
  rows: CellValue[][];
}

// ─── Field mapping (Step 1) ───────────────────────────────────────────────────

export interface FieldMapping {
  [fieldKey: string]: string;
}

export interface FieldDefaultValues {
  [fieldKey: string]: string;
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
  [label: string]: string;
}

// ─── Catalog types ────────────────────────────────────────────────────────────

export interface RoleCatalogItem {
  id: string;
  name: string;
  hasReports: boolean;
  errors: string[];
  valid: boolean;
}

export interface TeamCatalogItem {
  id: string;
  name: string;
  isMain: boolean;
  leadershipMode: LeadershipMode;
  parentIds: string[];
  errors: string[];
  valid: boolean;
}

export interface AssignmentColumnMapping {
  member: string;
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

export type LeaderSelectionMode = 'specific' | 'all';

export interface LeaderAssignment {
  teamId: string;
  teamName: string;
  leaderRole: string;
  leaderSelectionMode: LeaderSelectionMode;
  leaderPersons: string[];
  candidates: AssignmentItem[];
  errors: string[];
  valid: boolean;
}

// ─── Final JSON output ────────────────────────────────────────────────────────

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

// ─── Wizard context ───────────────────────────────────────────────────────────

export interface Step1State {
  source: FileParseResult | null;
  mapping: FieldMapping;
  defaultValues: FieldDefaultValues;
  workModeValueMap: WorkModeValueMap;
  validationResults: ValidationResult[];
  processedRows: ProcessedRow[];
}

export interface Step2State {
  sourceData: StepSourceData;
  selectedColumn: string;
  catalog: RoleCatalogItem[];
}

export interface Step3State {
  sourceData: StepSourceData;
  selectedColumn: string;
  catalog: TeamCatalogItem[];
}

export interface Step4State {
  sourceData: StepSourceData;
  columnMapping: AssignmentColumnMapping;
  catalog: AssignmentItem[];
}

export interface Step5State {
  assignments: LeaderAssignment[];
}

export interface WizardState {
  currentStep: StepNumber;
  step1: Step1State;
  step2: Step2State;
  step3: Step3State;
  step4: Step4State;
  step5: Step5State;
}
