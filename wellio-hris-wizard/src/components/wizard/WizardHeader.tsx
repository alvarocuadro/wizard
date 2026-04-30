import { Box, Typography, Button } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export function WizardHeader() {
  return (
    <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
      <Button
        size="small"
        variant="text"
        color="inherit"
        startIcon={<RestartAltIcon />}
        onClick={() => window.location.reload()}
        sx={{ position: 'absolute', right: 0, top: 0, color: 'text.disabled' }}
      >
        Reiniciar
      </Button>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: 'primary.main' }}>
        Wellio HRIS
      </Typography>
      <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
        Configuración inicial de la estructura organizacional
      </Typography>
    </Box>
  );
}
