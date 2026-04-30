import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';

interface JsonPreviewModalProps {
  open: boolean;
  onClose: () => void;
  json: string;
  onCopy: () => void;
  copied: boolean;
}

export function JsonPreviewModal({ open, onClose, json, onCopy, copied }: JsonPreviewModalProps) {
  function handleDownload() {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wellio-org-structure.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Estructura organizacional — JSON
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label="Cerrar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 3,
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            overflowX: 'auto',
            maxHeight: '60vh',
            bgcolor: '#1a1a2e',
            color: '#e2e2e2',
            whiteSpace: 'pre',
          }}
        >
          {json}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload}>
          Descargar
        </Button>
        <Button
          variant="contained"
          startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
          onClick={onCopy}
          color={copied ? 'success' : 'primary'}
        >
          {copied ? 'Copiado' : 'Copiar JSON'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
