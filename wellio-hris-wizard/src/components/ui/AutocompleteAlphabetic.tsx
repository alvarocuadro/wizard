import { Autocomplete, TextField, type AutocompleteProps } from '@mui/material';

interface AutocompleteAlphabeticProps
  extends Omit<AutocompleteProps<string, false, false, false>, 'renderInput' | 'options'> {
  options: string[];
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}

export function AutocompleteAlphabetic({
  options,
  label,
  placeholder,
  error,
  helperText,
  fullWidth = true,
  ...props
}: AutocompleteAlphabeticProps) {
  const sorted = [...options].sort((a, b) =>
    a.localeCompare(b, 'es', { sensitivity: 'base' })
  );

  return (
    <Autocomplete
      options={sorted}
      fullWidth={fullWidth}
      filterOptions={(opts, state) =>
        opts.filter((o) =>
          o.toLowerCase().includes(state.inputValue.toLowerCase())
        )
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          size="small"
        />
      )}
      {...props}
    />
  );
}
