import { useMemo, useCallback } from 'react';
import { useWizardContext } from '../context/WizardContext';
import { REQUIRED_FIELDS } from '../utils/fields';
import { NONE_VALUE } from '../utils/constants';
import type { StepNumber, WizardState } from '../utils/types';

function isStep1FieldConfigured(state: WizardState, fieldKey: string): boolean {
  const mappedValue = state.step1.mapping[fieldKey];
  return Boolean(mappedValue && mappedValue !== NONE_VALUE);
}

function getBlockReasonForStep(step: StepNumber, state: WizardState): string | null {
  const { step1, step2, step3, step5 } = state;

  if (step === 1) {
    const incomplete = REQUIRED_FIELDS.filter((field) => !isStep1FieldConfigured(state, field.key));
    if (incomplete.length > 0) {
      return `Mapea los campos obligatorios: ${incomplete.map((field) => field.label).join(', ')}.`;
    }
    const invalidCount = step1.validationResults.filter((result) => !result.valid && !result.omitted).length;
    if (invalidCount > 0) {
      return `Hay ${invalidCount} fila${invalidCount > 1 ? 's' : ''} con errores sin resolver. Corregilas, omitilas o revalida antes de continuar.`;
    }
    return null;
  }

  if (step === 2) {
    if (!step2.selectedColumn || step2.selectedColumn === NONE_VALUE) {
      return 'Selecciona una columna de roles.';
    }
    if (step2.catalog.length === 0) {
      return 'No se encontraron roles en la columna seleccionada.';
    }
    if (step2.catalog.some((role) => !role.valid)) {
      return 'Corrige los errores en los roles antes de continuar.';
    }
    return null;
  }

  if (step === 3) {
    if (!step3.selectedColumn || step3.selectedColumn === NONE_VALUE) {
      return 'Selecciona una columna de equipos.';
    }
    if (step3.catalog.length === 0) {
      return 'No se encontraron equipos en la columna seleccionada.';
    }
    if (step3.catalog.some((team) => !team.valid)) {
      return 'Corrige los errores en los equipos antes de continuar.';
    }
    return null;
  }

  if (step === 4) return null;

  if (step === 5) {
    if (step5.assignments.some((assignment) => !assignment.valid)) {
      return 'Completa todas las asignaciones de lideres antes de finalizar.';
    }
    return null;
  }

  return null;
}

function getHighestAvailableStep(state: WizardState): StepNumber {
  let highestAvailable: StepNumber = 1;
  if (getBlockReasonForStep(1, state) === null) highestAvailable = 2;
  if (highestAvailable >= 2 && getBlockReasonForStep(2, state) === null) highestAvailable = 3;
  if (highestAvailable >= 3 && getBlockReasonForStep(3, state) === null) highestAvailable = 4;
  if (highestAvailable >= 4 && getBlockReasonForStep(4, state) === null) highestAvailable = 5;
  return highestAvailable;
}

export function useWizardNavigation() {
  const { state, dispatch } = useWizardContext();
  const { currentStep } = state;

  const blockReason = useMemo(() => getBlockReasonForStep(currentStep, state), [currentStep, state]);
  const canAdvance = blockReason === null;
  const highestAvailableStep = useMemo(() => getHighestAvailableStep(state), [state]);

  const goNext = useCallback(() => {
    if (!canAdvance) return;
    if (currentStep < 5) {
      dispatch({ type: 'GO_TO_STEP', payload: (currentStep + 1) as StepNumber });
    }
  }, [canAdvance, currentStep, dispatch]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      dispatch({ type: 'GO_TO_STEP', payload: (currentStep - 1) as StepNumber });
    }
  }, [currentStep, dispatch]);

  const goTo = useCallback(
    (step: StepNumber) => {
      if (step <= highestAvailableStep) {
        dispatch({ type: 'GO_TO_STEP', payload: step });
      }
    },
    [dispatch, highestAvailableStep]
  );

  return { currentStep, canAdvance, blockReason, goNext, goBack, goTo, highestAvailableStep };
}
