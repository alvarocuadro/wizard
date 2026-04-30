import { type ReactElement } from 'react';
import { ThemeProvider, CssBaseline, Paper } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/es';
import { theme as wellioTheme } from './theme/theme';
import { WizardProvider } from './context/WizardContext';
import { WizardLayout } from './components/wizard/WizardLayout';
import { WizardHeader } from './components/wizard/WizardHeader';
import { StepperPills } from './components/wizard/StepperPills';
import { StepNavigation } from './components/wizard/StepNavigation';
import { Step1Panel } from './components/steps/Step1Panel';
import { Step2Panel } from './components/steps/Step2Panel';
import { Step3Panel } from './components/steps/Step3Panel';
import { Step4Panel } from './components/steps/Step4Panel';
import { Step5Panel } from './components/steps/Step5Panel';
import { useWizardContext } from './context/WizardContext';
import { useWizardNavigation } from './hooks/useWizardNavigation';
import type { StepNumber } from './utils/types';

function WizardContent() {
  const { state } = useWizardContext();
  const { currentStep, canAdvance, blockReason, goNext, goBack, goTo, highestAvailableStep } =
    useWizardNavigation();

  const panels: Record<StepNumber, ReactElement> = {
    1: <Step1Panel />,
    2: <Step2Panel />,
    3: <Step3Panel />,
    4: <Step4Panel />,
    5: <Step5Panel />,
  };

  return (
    <WizardLayout>
      <WizardHeader />
      <StepperPills
        currentStep={currentStep}
        highestAvailableStep={highestAvailableStep}
        onGoTo={goTo}
      />
      <Paper
        elevation={0}
        variant="outlined"
        sx={{ borderRadius: 4, p: { xs: 2, sm: 4 }, minHeight: 400 }}
      >
        <div key={state.currentStep}>
          {panels[currentStep]}
        </div>
        <StepNavigation
          currentStep={currentStep}
          canAdvance={canAdvance}
          blockReason={blockReason}
          onBack={goBack}
          onNext={goNext}
        />
      </Paper>
    </WizardLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={wellioTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <WizardProvider>
          <WizardContent />
        </WizardProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
