import { useState } from 'react';
import { Box, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { FileUploadZone } from '../ui/FileUploadZone';
import { useFileParser } from '../../hooks/useFileParser';
import type { FileParseResult, SourceMode } from '../../utils/types';

interface SourceFileChoiceProps {
  step1FileName: string;
  mode: SourceMode;
  onSameFile: () => void;
  onOtherFile: (result: FileParseResult) => void;
  currentOtherFileName?: string;
}

export function SourceFileChoice({
  step1FileName,
  mode,
  onSameFile,
  onOtherFile,
  currentOtherFileName,
}: SourceFileChoiceProps) {
  const { parse, loading, error } = useFileParser();
  const [uiMode, setUiMode] = useState<SourceMode>(mode);

  function handleChange(newMode: SourceMode) {
    setUiMode(newMode);
    if (newMode === 'same') onSameFile();
  }

  async function handleFile(file: File) {
    try {
      const result = await parse(file);
      onOtherFile(result);
    } catch {
      // error displayed in zone
    }
  }

  const optionSx = (selected: boolean) => ({
    flex: 1,
    border: '1px solid',
    borderColor: selected ? 'primary.main' : 'divider',
    borderRadius: '10px',
    px: 2,
    py: 1.25,
    bgcolor: selected ? 'primary.light' : 'background.paper',
    transition: 'all 150ms ease',
    '& .MuiFormControlLabel-label': { width: '100%' },
  });

  return (
    <Box>
      <RadioGroup
        row
        value={uiMode}
        onChange={(e) => handleChange(e.target.value as SourceMode)}
        sx={{ display: 'flex', gap: 1.5, flexWrap: 'nowrap' }}
      >
        <FormControlLabel
          value="same"
          sx={optionSx(uiMode === 'same')}
          control={<Radio size="small" sx={{ p: 0.75 }} />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InsertDriveFileOutlinedIcon
                sx={{ fontSize: 16, color: uiMode === 'same' ? 'primary.main' : '#6B7280' }}
              />
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: uiMode === 'same' ? 'primary.main' : '#374151', lineHeight: 1.2 }}>
                  Mismo archivo
                </Typography>
                {step1FileName && (
                  <Typography sx={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.2 }}>
                    {step1FileName}
                  </Typography>
                )}
              </Box>
            </Box>
          }
        />
        <FormControlLabel
          value="other"
          sx={optionSx(uiMode === 'other')}
          control={<Radio size="small" sx={{ p: 0.75 }} />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileUploadOutlinedIcon
                sx={{ fontSize: 16, color: uiMode === 'other' ? 'primary.main' : '#6B7280' }}
              />
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: uiMode === 'other' ? 'primary.main' : '#374151', lineHeight: 1.2 }}>
                  Subir otro archivo
                </Typography>
                {currentOtherFileName && uiMode === 'other' && (
                  <Typography sx={{ fontSize: '11px', color: 'success.dark', lineHeight: 1.2 }}>
                    ✓ {currentOtherFileName}
                  </Typography>
                )}
              </Box>
            </Box>
          }
        />
      </RadioGroup>

      {uiMode === 'other' && (
        <Box sx={{ mt: 2 }}>
          <FileUploadZone onFile={handleFile} loading={loading} error={error} />
        </Box>
      )}
    </Box>
  );
}
