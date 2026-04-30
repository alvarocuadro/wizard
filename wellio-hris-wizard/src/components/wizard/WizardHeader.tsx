import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import RestoreIcon from '@mui/icons-material/Restore';
import { useWizardContext } from '../../context/WizardContext';
import type { WizardState } from '../../utils/types';

const DRAFT_STORAGE_KEY = 'wellio-hris-wizard-draft-v1';

interface StoredDraft {
  savedAt: string;
  state: WizardState;
}

function readDraft(): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDraft;
  } catch {
    return null;
  }
}

export function WizardHeader() {
  const { state, dispatch } = useWizardContext();
  const [status, setStatus] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    setHasDraft(Boolean(readDraft()));
  }, []);

  const savedAtLabel = useMemo(() => {
    const draft = readDraft();
    if (!draft?.savedAt) return null;
    const date = new Date(draft.savedAt);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('es-AR');
  }, [hasDraft, status]);

  function handleSaveDraft() {
    try {
      const payload: StoredDraft = {
        savedAt: new Date().toISOString(),
        state,
      };
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      setHasDraft(true);
      setStatus('Borrador guardado. Podes seguir mas tarde.');
    } catch {
      setStatus('No se pudo guardar borrador en este navegador.');
    }
  }

  function handleLoadDraft() {
    const draft = readDraft();
    if (!draft) {
      setHasDraft(false);
      setStatus('No hay borrador guardado disponible.');
      return;
    }
    dispatch({ type: 'SET_WIZARD_STATE', payload: draft.state });
    setStatus('Borrador cargado.');
  }

  return (
    <Box
      sx={{
        textAlign: 'center',
        mb: 5,
        position: 'relative',
        px: { xs: 1, md: 0 },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          maxWidth: { xs: '100%', md: 420 },
        }}
      >
        {hasDraft && (
          <Button
            size="small"
            variant="text"
            color="inherit"
            startIcon={<RestoreIcon />}
            onClick={handleLoadDraft}
            sx={{ color: 'text.secondary' }}
          >
            Cargar borrador
          </Button>
        )}
        <Button
          size="small"
          variant="text"
          color="inherit"
          startIcon={<SaveOutlinedIcon />}
          onClick={handleSaveDraft}
          sx={{ color: 'text.secondary' }}
        >
          Guardar borrador y seguir mas tarde
        </Button>
        <Button
          size="small"
          variant="text"
          color="inherit"
          startIcon={<RestartAltIcon />}
          onClick={() => window.location.reload()}
          sx={{ color: 'text.disabled' }}
        >
          Reiniciar
        </Button>
      </Box>

      <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: 'primary.main' }}>
        Wizard HRIS
      </Typography>
      <Typography variant="subtitle1" sx={{ color: 'text.secondary', maxWidth: 720, mx: 'auto' }}>
        Configuracion inicial de la estructura organizacional
      </Typography>

      {(status || savedAtLabel) && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Alert
            severity="info"
            sx={{ borderRadius: 3, maxWidth: 560, width: '100%', textAlign: 'left' }}
          >
            {status ?? `Borrador disponible. Ultimo guardado: ${savedAtLabel}.`}
          </Alert>
        </Box>
      )}
    </Box>
  );
}
