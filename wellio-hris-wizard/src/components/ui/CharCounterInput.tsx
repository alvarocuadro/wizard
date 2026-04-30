import { TextField, InputAdornment, Typography } from '@mui/material';

interface CharCounterInputProps {
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  label: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

export function CharCounterInput({
  value,
  onChange,
  maxLength,
  label,
  error,
  helperText,
  disabled,
  size = 'small',
}: CharCounterInputProps) {
  const remaining = maxLength - (value?.length ?? 0);

  return (
    <TextField
      fullWidth
      size={size}
      label={label}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
      error={error}
      helperText={helperText}
      disabled={disabled}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Typography
                variant="caption"
                sx={{
                  color: remaining <= 5 ? 'error.main' : 'text.disabled',
                  minWidth: 22,
                  textAlign: 'right',
                }}
              >
                {remaining}
              </Typography>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
