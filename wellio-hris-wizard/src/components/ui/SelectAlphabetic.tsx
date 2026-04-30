import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  type SelectProps,
} from '@mui/material';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectAlphabeticProps extends Omit<SelectProps<string>, 'onChange'> {
  options: SelectOption[];
  label?: string;
  helperText?: string;
  error?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
  fullWidth?: boolean;
}

export function SelectAlphabetic({
  options,
  label,
  helperText,
  error,
  placeholder,
  onChange,
  fullWidth = true,
  value,
  ...props
}: SelectAlphabeticProps) {
  const sorted = [...options].sort((a, b) =>
    a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })
  );

  return (
    <FormControl fullWidth={fullWidth} error={error} size="small">
      {label && <InputLabel>{label}</InputLabel>}
      <Select<string>
        value={(value as string) ?? ''}
        label={label}
        onChange={(e) => onChange?.(e.target.value)}
        displayEmpty={!!placeholder}
        {...props}
      >
        {placeholder && (
          <MenuItem value="" disabled>
            <em>{placeholder}</em>
          </MenuItem>
        )}
        {sorted.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
