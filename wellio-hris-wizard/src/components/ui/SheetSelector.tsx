import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';

interface SheetSelectorProps {
  sheetNames: string[];
  value: string;
  onChange: (sheetName: string) => void;
}

export function SheetSelector({ sheetNames, value, onChange }: SheetSelectorProps) {
  if (sheetNames.length <= 1) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
      <TableChartIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
      <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
        Hoja de datos:
      </Typography>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <Select
          value={value || sheetNames[0]}
          onChange={(e) => onChange(e.target.value)}
          sx={{ fontSize: '0.8rem' }}
        >
          {sheetNames.map((name) => (
            <MenuItem key={name} value={name} sx={{ fontSize: '0.85rem' }}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
