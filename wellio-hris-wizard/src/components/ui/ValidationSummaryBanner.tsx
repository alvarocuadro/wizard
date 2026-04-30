import { Alert, Box, Chip } from '@mui/material';

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
    <Alert severity={hasErrors ? 'warning' : 'success'} sx={{ borderRadius: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>
          {total} {label}
        </span>
        <Chip label={`${valid} validos`} size="small" color="success" />
        {invalid > 0 && <Chip label={`${invalid} con errores`} size="small" color="error" />}
      </Box>
    </Alert>
  );
}
