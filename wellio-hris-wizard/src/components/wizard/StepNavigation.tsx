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

export function StepNavigation({ currentStep, canAdvance, blockReason, onBack, onNext }: StepNavigationProps) {
  return (
    <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
      {blockReason && (
        <Typography
          variant="caption"
          sx={{
            color: 'warning.dark',
            display: 'block',
            textAlign: 'center',
            mb: 2,
            bgcolor: 'warning.light',
            borderRadius: '8px',
            px: 2,
            py: 1,
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {blockReason}
        </Typography>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon sx={{ fontSize: '16px !important' }} />}
          onClick={onBack}
          disabled={currentStep === 1}
          sx={{
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '14px',
            textTransform: 'none',
            borderColor: 'divider',
            color: '#374151',
            px: 3,
            py: 1.25,
            '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'primary.light' },
            '&.Mui-disabled': { opacity: 0.35 },
          }}
        >
          Anterior
        </Button>

        {currentStep < 5 && (
          <Tooltip title={blockReason ?? ''} arrow disableHoverListener={canAdvance}>
            <span>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon sx={{ fontSize: '16px !important' }} />}
                onClick={onNext}
                disabled={!canAdvance}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '14px',
                  textTransform: 'none',
                  bgcolor: 'primary.main',
                  px: 3,
                  py: 1.25,
                  boxShadow: '0 4px 12px rgba(124,58,237,0.25)',
                  '&:hover': { bgcolor: 'primary.dark', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' },
                  '&.Mui-disabled': { opacity: 0.4, boxShadow: 'none' },
                }}
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
