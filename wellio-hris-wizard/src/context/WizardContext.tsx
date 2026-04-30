import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { wizardReducer, type WizardAction } from './wizardReducer';
import { initialState } from './initialState';
import type { WizardState } from '../utils/types';

interface WizardContextValue {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizardContext(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizardContext must be used inside WizardProvider');
  return ctx;
}
