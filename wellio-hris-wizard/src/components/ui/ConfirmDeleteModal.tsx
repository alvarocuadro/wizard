import { useState } from 'react';
import { Typography } from '@mui/material';
import { CrudModal } from './CrudModal';

interface ConfirmDeleteModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDeleteModal({
  open,
  title = 'Confirmar eliminación',
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <CrudModal
      open={open}
      title={title}
      onClose={onClose}
      maxWidth="xs"
      actions={[
        {
          label: cancelLabel,
          onClick: onClose,
          variant: 'outlined',
          color: 'inherit',
          disabled: loading,
        },
        {
          label: confirmLabel,
          onClick: handleConfirm,
          color: 'error',
          variant: 'contained',
          loading,
        },
      ]}
    >
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </CrudModal>
  );
}
