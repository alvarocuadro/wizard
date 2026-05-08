import { useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface FileUploadZoneProps {
  onFile: (file: File) => void;
  loading?: boolean;
  error?: string | null;
  accept?: string;
  label?: string;
}

export function FileUploadZone({
  onFile,
  loading = false,
  error,
  accept = '.xlsx,.xls,.csv',
  label = 'Arrastrá o hacé click para subir tu archivo',
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  }

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => !loading && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      sx={{
        border: '2px dashed',
        borderColor: dragging ? 'primary.main' : error ? 'error.main' : '#D1D5DB',
        borderRadius: '12px',
        p: 5,
        textAlign: 'center',
        cursor: loading ? 'default' : 'pointer',
        transition: 'all 200ms ease',
        outline: 'none',
        bgcolor: dragging ? 'primary.light' : error ? '#FEE2E2' : '#FAFAFA',
        '&:hover': {
          borderColor: loading ? '#D1D5DB' : 'primary.main',
          bgcolor: loading ? '#FAFAFA' : 'primary.light',
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={32} color="primary" />
          <Typography variant="caption" sx={{ color: '#6B7280' }}>
            Procesando archivo…
          </Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '12px',
              bgcolor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <UploadFileIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          </Box>

          <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#111827', mb: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6B7280' }}>
            Formatos aceptados: .xlsx, .xls, .csv
          </Typography>

          {error && (
            <Typography
              variant="caption"
              sx={{ color: 'error.main', display: 'block', mt: 1.5, fontWeight: 500 }}
            >
              {error}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
