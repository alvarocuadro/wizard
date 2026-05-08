import { Box, Container } from '@mui/material';
import type { ReactNode } from 'react';

export function WizardLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F0EDF9' }}>
      <Container maxWidth="lg" sx={{ py: 5 }}>
        {children}
      </Container>
    </Box>
  );
}
