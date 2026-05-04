import { useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { FeatherUploadIcon } from './icons/FeatherIcons';

interface FileUploadZoneProps {
  onFile: (file: File) => void;
  loading?: boolean;
  error?: string | null;
  accept?: string;
}

export function FileUploadZone({
  onFile,
  loading = false,
  error,
  accept = '.xlsx,.xls,.csv,.xltx',
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
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      sx={{
        border: '1px dashed',
        borderColor: dragging ? 'primary.main' : error ? 'error.main' : 'divider',
        borderRadius: 3,
        minHeight: { xs: 220, md: 182 },
        px: { xs: 3, md: 4 },
        py: { xs: 4, md: 4.5 },
        textAlign: 'center',
        cursor: loading ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: dragging ? 'rgba(124,58,237,0.04)' : 'background.paper',
        '&:hover': {
          borderColor: loading ? 'divider' : 'primary.main',
          bgcolor: loading ? 'background.paper' : 'rgba(124,58,237,0.03)',
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
        <CircularProgress size={36} />
      ) : (
        <Box sx={{ width: '100%', maxWidth: 460, mx: 'auto' }}>
          <FeatherUploadIcon sx={{ fontSize: 34, color: '#B0B0B8', mb: 1.75 }} />
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: '#A9A9B2',
              mb: 0.75,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.55rem', md: '1.9rem' },
            }}
          >
            Arrasta tu archivo aqui
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#B1B1BA',
              mb: 0.75,
              lineHeight: 1.35,
              fontSize: { xs: '1rem', md: '1.05rem' },
            }}
          >
            o{' '}
            <Box component="span" sx={{ color: '#B59CFF', fontWeight: 700 }}>
              haz click
            </Box>{' '}
            y cargalo desde tu dispositivo
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#B1B1BA',
              maxWidth: 360,
              mx: 'auto',
              fontSize: { xs: '0.92rem', md: '0.96rem' },
              lineHeight: 1.45,
            }}
          >
            Puedes cargar archivos xlsx, xls, csv o xltx.
          </Typography>
          {error && (
            <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 1.5 }}>
              {error}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
