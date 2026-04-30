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
        borderColor: dragging ? 'primary.main' : error ? 'error.main' : 'divider',
        borderRadius: 3,
        p: 5,
        textAlign: 'center',
        cursor: loading ? 'default' : 'pointer',
        transition: 'all 0.2s',
        outline: 'none',
        bgcolor: dragging ? 'action.hover' : 'background.paper',
        '&:hover': {
          borderColor: loading ? 'divider' : 'primary.main',
          bgcolor: loading ? 'background.paper' : 'action.hover',
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
        <>
          <UploadFileIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
          <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Formatos aceptados: .xlsx, .xls, .csv
          </Typography>
          {error && (
            <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 1 }}>
              {error}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
