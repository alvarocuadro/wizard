import { NONE_VALUE } from '../utils/constants';
import type { WizardState, StepSourceData } from '../utils/types';

export const EMPTY_SOURCE_DATA: StepSourceData = {
  mode: 'same',
  fileName: '',
  headers: [],
  rows: [],
};

export const initialState: WizardState = {
  currentStep: 1,
  step1: {
    source: null,
    mapping: {},
    workModeValueMap: { Presencial: '', Híbrido: '', Remoto: '' },
    validationResults: [],
    processedRows: [],
  },
  step2: {
    sourceData: { ...EMPTY_SOURCE_DATA },
    selectedColumn: NONE_VALUE,
    catalog: [],
  },
  step3: {
    sourceData: { ...EMPTY_SOURCE_DATA },
    selectedColumn: NONE_VALUE,
    catalog: [],
  },
  step4: {
    sourceData: { ...EMPTY_SOURCE_DATA },
    columnMapping: { member: NONE_VALUE, role: NONE_VALUE, team: NONE_VALUE },
    catalog: [],
  },
  step5: {
    assignments: [],
  },
};
