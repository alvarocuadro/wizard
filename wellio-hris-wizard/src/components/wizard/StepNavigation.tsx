import { Box, Button, Tooltip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { StepNumber } from '../../utils/types';

interface StepNavigationProps {
  currentStep: StepNumber;
  canAdvance: boolean;
  blockReason: string | null;
  onBack: () => void;
  onNext: () => void;
}

export function StepNavigation({
  currentStep,
  canAdvance,
  blockReason,
  onBack,
  onNext,
}: StepNavigationProps) {
  return (
    <Box sx={{ mt: 5 }}>
      {blockReason && (
        <Typography
          variant="caption"
          sx={{ color: 'warning.dark', display: 'block', textAlign: 'center', mb: 1.5 }}
        >
          {blockReason}
        </Typography>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          disabled={currentStep === 1}
        >
          Anterior
        </Button>
        {currentStep < 5 && (
          <Tooltip title={blockReason ?? ''} arrow disableHoverListener={canAdvance}>
            <span>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={onNext}
                disabled={!canAdvance}
              >
                Siguiente
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
