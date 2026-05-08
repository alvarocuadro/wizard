import { Box, Chip, Typography } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface ValidationSummaryBannerProps {
  total: number;
  valid: number;
  invalid: number;
  hasErrors: boolean;
  label?: string;
}

export function ValidationSummaryBanner({
  total,
  valid,
  invalid,
  hasErrors,
  label = 'registros',
}: ValidationSummaryBannerProps) {
  if (total === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexWrap: 'wrap',
        px: 2.5,
        py: 1.5,
        mb: 2,
        borderRadius: '10px',
        border: '1px solid',
        borderColor: hasErrors ? 'warning.main' : 'success.main',
        bgcolor: hasErrors ? 'warning.light' : 'success.light',
      }}
    >
      {hasErrors ? (
        <WarningAmberIcon sx={{ fontSize: 18, color: 'warning.dark', flexShrink: 0 }} />
      ) : (
        <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'success.dark', flexShrink: 0 }} />
      )}

      <Typography
        sx={{
          fontSize: '13px',
          fontWeight: 600,
          color: hasErrors ? 'warning.dark' : 'success.dark',
        }}
      >
        {total} {label}
      </Typography>

      <Chip
        label={`${valid} válidos`}
        size="small"
        sx={{
          height: 22,
          fontSize: '11px',
          fontWeight: 700,
          bgcolor: 'success.main',
          color: '#fff',
          borderRadius: '999px',
        }}
      />

      {invalid > 0 && (
        <Chip
          label={`${invalid} con errores`}
          size="small"
          sx={{
            height: 22,
            fontSize: '11px',
            fontWeight: 700,
            bgcolor: 'error.main',
            color: '#fff',
            borderRadius: '999px',
          }}
        />
      )}
    </Box>
  );
}
