import { useState } from 'react';
import { Box, FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import { FileUploadZone } from '../ui/FileUploadZone';
import { useFileParser, type ParseMode } from '../../hooks/useFileParser';
import type { FileParseResult, SourceMode } from '../../utils/types';

interface SourceFileChoiceProps {
  step1FileName: string;
  mode: SourceMode;
  onSameFile: () => void;
  onOtherFile: (result: FileParseResult) => void;
  currentOtherFileName?: string;
  parseMode?: ParseMode;
}

export function SourceFileChoice({
  step1FileName,
  mode,
  onSameFile,
  onOtherFile,
  currentOtherFileName,
  parseMode = 'default',
}: SourceFileChoiceProps) {
  const { parse, loading, error } = useFileParser();
  const [uiMode, setUiMode] = useState<SourceMode>(mode);

  function handleChange(newMode: SourceMode) {
    setUiMode(newMode);
    if (newMode === 'same') onSameFile();
  }

  async function handleFile(file: File) {
    try {
      const result = await parse(file, { mode: parseMode });
      onOtherFile(result);
    } catch {
      // error displayed in zone
    }
  }

  return (
    <Box>
      <FormControl>
        <RadioGroup
          row
          value={uiMode}
          onChange={(e) => handleChange(e.target.value as SourceMode)}
        >
          <FormControlLabel
            value="same"
            control={<Radio size="small" />}
            label={
              <Typography variant="body2">
                Mismo archivo que Paso 1{step1FileName ? ` (${step1FileName})` : ''}
              </Typography>
            }
          />
          <FormControlLabel
            value="other"
            control={<Radio size="small" />}
            label={<Typography variant="body2">Subir otro archivo</Typography>}
          />
        </RadioGroup>
      </FormControl>

      {uiMode === 'other' && (
        <Box sx={{ mt: 2 }}>
          <FileUploadZone onFile={handleFile} loading={loading} error={error} />
          {currentOtherFileName && (
            <Typography
              variant="caption"
              sx={{ color: 'success.main', mt: 1, display: 'block' }}
            >
              ✓ {currentOtherFileName} cargado
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
