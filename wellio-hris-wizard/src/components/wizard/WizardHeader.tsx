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
      const payload: StoredDraft = { savedAt: new Date().toISOString(), state };
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

  const draftBtnSx = {
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'none',
    color: '#6B7280',
    '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
  } as const;

  return (
    <Box sx={{ mb: 5 }}>
      {/* Brand + draft controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          mb: 1,
        }}
      >
        {/* Logo mark + title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography sx={{ fontSize: '18px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
              W
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.1 }}
            >
              HRIS Wizard
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Configuración inicial de la estructura organizacional
            </Typography>
          </Box>
        </Box>

        {/* Draft actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {hasDraft && (
            <Button
              size="small"
              variant="text"
              startIcon={<RestoreIcon sx={{ fontSize: '14px !important' }} />}
              onClick={handleLoadDraft}
              sx={draftBtnSx}
            >
              Cargar borrador
            </Button>
          )}
          <Button
            size="small"
            variant="text"
            startIcon={<SaveOutlinedIcon sx={{ fontSize: '14px !important' }} />}
            onClick={handleSaveDraft}
            sx={draftBtnSx}
          >
            Guardar borrador
          </Button>
          <Button
            size="small"
            variant="text"
            startIcon={<RestartAltIcon sx={{ fontSize: '14px !important' }} />}
            onClick={() => window.location.reload()}
            sx={{ ...draftBtnSx, color: '#9CA3AF' }}
          >
            Reiniciar
          </Button>
        </Box>
      </Box>

      {(status || savedAtLabel) && (
        <Alert
          severity="info"
          sx={{ borderRadius: '10px', mt: 2, fontSize: '13px' }}
        >
          {status ?? `Borrador disponible. Último guardado: ${savedAtLabel}.`}
        </Alert>
      )}
    </Box>
  );
}
