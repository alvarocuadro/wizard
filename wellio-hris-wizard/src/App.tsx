import { type ReactElement, useState, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Paper, Backdrop, CircularProgress, Typography, Box } from '@mui/material';
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

const SAVE_DELAY_MS = 900;

function WizardContent() {
  const { state } = useWizardContext();
  const { currentStep, canAdvance, blockReason, goNext, goBack, goTo, highestAvailableStep } =
    useWizardNavigation();
  const [isSaving, setIsSaving] = useState(false);

  const handleNext = useCallback(() => {
    if (!canAdvance) return;
    setIsSaving(true);
    setTimeout(() => {
      goNext();
      setIsSaving(false);
    }, SAVE_DELAY_MS);
  }, [canAdvance, goNext]);

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
          onNext={handleNext}
        />
      </Paper>

      <Backdrop
        open={isSaving}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 1, flexDirection: 'column', gap: 2 }}
      >
        <CircularProgress size={52} sx={{ color: '#fff' }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
            Guardando datos…
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.5 }}>
            Por favor esperá un momento
          </Typography>
        </Box>
      </Backdrop>
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
