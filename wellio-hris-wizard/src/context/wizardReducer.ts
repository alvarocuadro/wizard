import { NONE_VALUE } from '../utils/constants';
import type {
  WizardState,
  StepNumber,
  FileParseResult,
  FieldMapping,
  WorkModeValueMap,
  ValidationResult,
  ProcessedRow,
  NormalizedRow,
  StepSourceData,
  RoleCatalogItem,
  TeamCatalogItem,
  AssignmentColumnMapping,
  AssignmentItem,
  LeaderAssignment,
} from '../utils/types';
import { EMPTY_SOURCE_DATA, initialState } from './initialState';

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
  // Reset cascade
  | { type: 'RESET_FROM_STEP'; payload: StepNumber };

const emptyStep2 = () => ({
  sourceData: { ...EMPTY_SOURCE_DATA },
  selectedColumn: NONE_VALUE,
  catalog: [] as RoleCatalogItem[],
});

const emptyStep3 = () => ({
  sourceData: { ...EMPTY_SOURCE_DATA },
  selectedColumn: NONE_VALUE,
  catalog: [] as TeamCatalogItem[],
});

const emptyStep4 = () => ({
  sourceData: { ...EMPTY_SOURCE_DATA },
  columnMapping: { member: NONE_VALUE, role: NONE_VALUE, team: NONE_VALUE },
  catalog: [] as AssignmentItem[],
});

const emptyStep5 = () => ({ assignments: [] as LeaderAssignment[] });

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload };

    // ── Step 1 ──
    case 'S1_SET_SOURCE':
      return { ...state, step1: { ...state.step1, source: action.payload } };
    case 'S1_SET_MAPPING':
      return { ...state, step1: { ...state.step1, mapping: action.payload } };
    case 'S1_SET_WORKMODE_MAP':
      return { ...state, step1: { ...state.step1, workModeValueMap: action.payload } };
    case 'S1_SET_VALIDATION':
      return {
        ...state,
        step1: {
          ...state.step1,
          validationResults: action.payload.results,
          processedRows: action.payload.processedRows,
        },
      };
    case 'S1_UPDATE_ROW': {
      const updated = state.step1.validationResults.map((r, i) =>
        i === action.payload.index ? { ...r, normalized: { ...r.normalized, ...action.payload.normalized } } : r
      );
      return { ...state, step1: { ...state.step1, validationResults: updated } };
    }
    case 'S1_TOGGLE_OMIT': {
      const updated = state.step1.validationResults.map((r, i) =>
        i === action.payload ? { ...r, omitted: !r.omitted } : r
      );
      return { ...state, step1: { ...state.step1, validationResults: updated } };
    }
    case 'S1_RESET_VALIDATION':
      return {
        ...state,
        step1: { ...state.step1, validationResults: [], processedRows: [] },
      };

    // ── Step 2 ──
    case 'S2_SET_SOURCE_DATA':
      return { ...state, step2: { ...state.step2, sourceData: action.payload } };
    case 'S2_SET_COLUMN':
      return { ...state, step2: { ...state.step2, selectedColumn: action.payload } };
    case 'S2_SET_CATALOG':
      return { ...state, step2: { ...state.step2, catalog: action.payload } };
    case 'S2_UPDATE_ROLE': {
      const catalog = state.step2.catalog.map((r) =>
        r.id === action.payload.id ? { ...r, ...action.payload.changes } : r
      );
      return { ...state, step2: { ...state.step2, catalog } };
    }

    // ── Step 3 ──
    case 'S3_SET_SOURCE_DATA':
      return { ...state, step3: { ...state.step3, sourceData: action.payload } };
    case 'S3_SET_COLUMN':
      return { ...state, step3: { ...state.step3, selectedColumn: action.payload } };
    case 'S3_SET_CATALOG':
      return { ...state, step3: { ...state.step3, catalog: action.payload } };
    case 'S3_UPDATE_TEAM': {
      const catalog = state.step3.catalog.map((t) =>
        t.id === action.payload.id ? { ...t, ...action.payload.changes } : t
      );
      return { ...state, step3: { ...state.step3, catalog } };
    }

    // ── Step 4 ──
    case 'S4_SET_SOURCE_DATA':
      return { ...state, step4: { ...state.step4, sourceData: action.payload } };
    case 'S4_SET_COLUMN_MAPPING':
      return { ...state, step4: { ...state.step4, columnMapping: action.payload } };
    case 'S4_SET_CATALOG':
      return { ...state, step4: { ...state.step4, catalog: action.payload } };
    case 'S4_UPDATE_ASSIGNMENT': {
      const catalog = state.step4.catalog.map((a, i) =>
        i === action.payload.index ? { ...a, ...action.payload.changes } : a
      );
      return { ...state, step4: { ...state.step4, catalog } };
    }

    // ── Step 5 ──
    case 'S5_SET_ASSIGNMENTS':
      return { ...state, step5: { assignments: action.payload } };
    case 'S5_UPDATE_ASSIGNMENT': {
      const assignments = state.step5.assignments.map((a) =>
        a.teamId === action.payload.teamId ? { ...a, ...action.payload.changes } : a
      );
      return { ...state, step5: { assignments } };
    }

    // ── Reset cascade ──
    case 'RESET_FROM_STEP': {
      const from = action.payload;
      return {
        ...state,
        ...(from <= 2 && { step2: emptyStep2() }),
        ...(from <= 3 && { step3: emptyStep3() }),
        ...(from <= 4 && { step4: emptyStep4() }),
        ...(from <= 5 && { step5: emptyStep5() }),
      };
    }

    default:
      return state;
  }
}

export { initialState };
