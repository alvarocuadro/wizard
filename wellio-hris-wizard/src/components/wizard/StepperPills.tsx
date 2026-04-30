import { Box, Chip } from '@mui/material';
import { STEP_LABELS } from '../../utils/constants';
import type { StepNumber } from '../../utils/types';

interface StepperPillsProps {
  currentStep: StepNumber;
  highestAvailableStep: StepNumber;
  onGoTo: (step: StepNumber) => void;
}

export function StepperPills({
  currentStep,
  highestAvailableStep,
  onGoTo,
}: StepperPillsProps) {
  const steps: StepNumber[] = [1, 2, 3, 4, 5];

  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 4 }}>
      {steps.map((step) => {
        const isActive = step === currentStep;
        const isPast = step < currentStep;
        const clickable = step <= highestAvailableStep;

        return (
          <Chip
            key={step}
            label={`${step}. ${STEP_LABELS[step]}`}
            clickable={clickable}
            onClick={() => clickable && onGoTo(step)}
            color={isActive ? 'primary' : 'default'}
            variant={isActive ? 'filled' : 'outlined'}
            sx={{
              fontWeight: isActive ? 700 : 500,
              opacity: clickable ? 1 : 0.45,
              cursor: clickable ? 'pointer' : 'default',
              borderColor: isPast && !isActive ? 'primary.main' : undefined,
              color: isPast && !isActive ? 'primary.main' : undefined,
            }}
          />
        );
      })}
    </Box>
  );
}
