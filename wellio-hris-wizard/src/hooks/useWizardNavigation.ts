import { useMemo, useCallback } from 'react';
import { useWizardContext } from '../context/WizardContext';
import { REQUIRED_FIELDS } from '../utils/fields';
import { NONE_VALUE } from '../utils/constants';
import type { StepNumber } from '../utils/types';

function getBlockReason(state: ReturnType<typeof useWizardContext>['state']): string | null {
  const { currentStep, step1, step2, step3, step5 } = state;

  if (currentStep === 1) {
    const unmapped = REQUIRED_FIELDS.filter(
      (f) => !step1.mapping[f.key] || step1.mapping[f.key] === NONE_VALUE
    );
    if (unmapped.length > 0) {
      return `Mapeá los campos obligatorios: ${unmapped.map((f) => f.label).join(', ')}.`;
    }
    return null;
  }

  if (currentStep === 2) {
    if (!step2.selectedColumn || step2.selectedColumn === NONE_VALUE) {
      return 'Seleccioná una columna de roles.';
    }
    if (step2.catalog.length === 0) {
      return 'No se encontraron roles en la columna seleccionada.';
    }
    if (step2.catalog.some((r) => !r.valid)) {
      return 'Corregí los errores en los roles antes de continuar.';
    }
    return null;
  }

  if (currentStep === 3) {
    if (!step3.selectedColumn || step3.selectedColumn === NONE_VALUE) {
      return 'Seleccioná una columna de equipos.';
    }
    if (step3.catalog.length === 0) {
      return 'No se encontraron equipos en la columna seleccionada.';
    }
    if (step3.catalog.some((t) => !t.valid)) {
      return 'Corregí los errores en los equipos antes de continuar.';
    }
    return null;
  }

  if (currentStep === 4) {
    return null; // No bloqueo en paso 4
  }

  if (currentStep === 5) {
    if (step5.assignments.some((a) => !a.valid)) {
      return 'Completá todas las asignaciones de líderes antes de finalizar.';
    }
    return null;
  }

  return null;
}

export function useWizardNavigation() {
  const { state, dispatch } = useWizardContext();
  const { currentStep } = state;

  const blockReason = useMemo(() => getBlockReason(state), [state]);
  const canAdvance = blockReason === null;

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
    (step: StepNumber) => dispatch({ type: 'GO_TO_STEP', payload: step }),
    [dispatch]
  );

  return { currentStep, canAdvance, blockReason, goNext, goBack, goTo };
}
