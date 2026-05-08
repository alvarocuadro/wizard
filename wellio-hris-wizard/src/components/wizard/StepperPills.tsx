import { Box, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { STEP_LABELS } from '../../utils/constants';
import type { StepNumber } from '../../utils/types';

interface StepperPillsProps {
  currentStep: StepNumber;
  highestAvailableStep: StepNumber;
  onGoTo: (step: StepNumber) => void;
}

export function StepperPills({ currentStep, highestAvailableStep, onGoTo }: StepperPillsProps) {
  const steps: StepNumber[] = [1, 2, 3, 4, 5];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        mb: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        overflow: 'hidden',
        p: 0.5,
      }}
    >
      {steps.map((step, idx) => {
        const isActive = step === currentStep;
        const isPast = step < currentStep;
        const clickable = step <= highestAvailableStep;

        return (
          <Box
            key={step}
            onClick={() => clickable && onGoTo(step)}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              py: 1.25,
              px: 1,
              borderRadius: '9px',
              cursor: clickable ? 'pointer' : 'default',
              bgcolor: isActive ? 'primary.main' : 'transparent',
              transition: 'all 200ms ease',
              '&:hover': clickable && !isActive
                ? { bgcolor: 'primary.light' }
                : {},
              position: 'relative',
              ...(idx < steps.length - 1 && !isActive && steps[idx + 1] !== currentStep
                ? {}
                : {}),
            }}
          >
            {/* Step indicator badge */}
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                bgcolor: isActive ? 'rgba(255,255,255,0.25)' : isPast ? 'success.light' : '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isPast ? (
                <CheckIcon sx={{ fontSize: 12, color: 'success.dark' }} />
              ) : (
                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: isActive ? '#fff' : clickable ? '#6B7280' : '#9CA3AF',
                    lineHeight: 1,
                  }}
                >
                  {step}
                </Typography>
              )}
            </Box>

            {/* Label */}
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: isActive ? 700 : isPast ? 600 : 500,
                color: isActive ? '#fff' : isPast ? 'primary.main' : clickable ? '#374151' : '#9CA3AF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {STEP_LABELS[step]}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
