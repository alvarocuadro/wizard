import { DatePicker, type DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

interface DatePickerESProps extends Omit<DatePickerProps, 'format'> {
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}

export function DatePickerES({ error, helperText, fullWidth, slotProps, ...props }: DatePickerESProps) {
  return (
    <DatePicker
      format="DD/MM/YYYY"
      {...props}
      slotProps={{
        ...slotProps,
        textField: {
          error,
          helperText,
          fullWidth,
          size: 'small',
          ...(slotProps?.textField as object),
        },
      }}
    />
  );
}

export function dayjsToDisplayString(value: Dayjs | null): string {
  if (!value || !value.isValid()) return '';
  return value.format('DD/MM/YYYY');
}

export function displayStringToDayjs(value: string): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value, 'DD/MM/YYYY', true);
  return parsed.isValid() ? parsed : null;
}
