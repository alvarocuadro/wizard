import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  CircularProgress,
  type DialogProps,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { ReactNode } from 'react';

interface CrudAction {
  label: string;
  onClick: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'info' | 'inherit';
  variant?: 'contained' | 'outlined' | 'text';
}

interface CrudModalProps extends Omit<DialogProps, 'onClose'> {
  title: string;
  onClose: () => void;
  actions?: CrudAction[];
  children: ReactNode;
  maxWidth?: DialogProps['maxWidth'];
}

export function CrudModal({
  title,
  onClose,
  actions = [],
  children,
  maxWidth = 'sm',
  ...dialogProps
}: CrudModalProps) {
  return (
    <Dialog
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      {...dialogProps}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pr: 2,
        }}
      >
        {title}
        <IconButton onClick={onClose} size="small" aria-label="Cerrar modal">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>{children}</DialogContent>

      {actions.length > 0 && (
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          {actions.map((action) => (
            <Button
              key={action.label}
              onClick={action.onClick}
              color={action.color ?? 'primary'}
              variant={action.variant ?? 'contained'}
              disabled={action.disabled || action.loading}
              startIcon={
                action.loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
            >
              {action.label}
            </Button>
          ))}
        </DialogActions>
      )}
    </Dialog>
  );
}
