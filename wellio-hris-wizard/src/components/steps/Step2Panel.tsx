import { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Chip,
} from '@mui/material';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { SourceFileChoice } from './SourceFileChoice';
import { CharCounterInput } from '../ui/CharCounterInput';
import { useWizardContext } from '../../context/WizardContext';
import { useColumnDetection } from '../../hooks/useColumnDetection';
import { useRolesCatalog } from '../../hooks/useRolesCatalog';
import { NONE_VALUE } from '../../utils/constants';
import type { FileParseResult, RoleCatalogItem } from '../../utils/types';

export function Step2Panel() {
  const { state, dispatch } = useWizardContext();
  const { step1, step2 } = state;
  const { detectRoleColumn } = useColumnDetection();
  const rolesCatalog = useRolesCatalog();
  const initialDetectDone = useRef(false);

  const effectiveSource =
    step2.sourceData.mode === 'same' && step1.source
      ? step1.source
      : step2.sourceData.headers.length > 0
      ? step2.sourceData
      : null;

  useEffect(() => {
    if (initialDetectDone.current || !effectiveSource || step2.selectedColumn !== NONE_VALUE) return;
    initialDetectDone.current = true;
    const col = detectRoleColumn(effectiveSource.headers);
    dispatch({ type: 'S2_SET_COLUMN', payload: col });
    if (col !== NONE_VALUE) {
      const catalog = rolesCatalog.build(
        effectiveSource.rows,
        effectiveSource.headers,
        col,
        step2.catalog
      );
      dispatch({ type: 'S2_SET_CATALOG', payload: catalog });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSameFile() {
    dispatch({ type: 'S2_SET_SOURCE_DATA', payload: { mode: 'same', fileName: '', headers: [], rows: [] } });
    dispatch({ type: 'S2_SET_COLUMN', payload: NONE_VALUE });
    dispatch({ type: 'S2_SET_CATALOG', payload: [] });
    dispatch({ type: 'RESET_FROM_STEP', payload: 3 });
    initialDetectDone.current = false;
  }

  function handleOtherFile(result: FileParseResult) {
    if (!result.headers.length) return;
    dispatch({ type: 'S2_SET_SOURCE_DATA', payload: { mode: 'other', ...result } });
    const col = detectRoleColumn(result.headers);
    dispatch({ type: 'S2_SET_COLUMN', payload: col });
    if (col !== NONE_VALUE) {
      const catalog = rolesCatalog.build(result.rows, result.headers, col, []);
      dispatch({ type: 'S2_SET_CATALOG', payload: catalog });
    } else {
      dispatch({ type: 'S2_SET_CATALOG', payload: [] });
    }
    dispatch({ type: 'RESET_FROM_STEP', payload: 3 });
  }

  function handleColumnChange(col: string) {
    dispatch({ type: 'S2_SET_COLUMN', payload: col });
    if (!effectiveSource) return;
    if (col !== NONE_VALUE) {
      const catalog = rolesCatalog.build(
        effectiveSource.rows,
        effectiveSource.headers,
        col,
        step2.catalog
      );
      dispatch({ type: 'S2_SET_CATALOG', payload: catalog });
    } else {
      dispatch({ type: 'S2_SET_CATALOG', payload: [] });
    }
    dispatch({ type: 'RESET_FROM_STEP', payload: 3 });
  }

  function handleRoleChange(id: string, changes: Partial<RoleCatalogItem>) {
    const updated = step2.catalog.map((r) => (r.id === id ? { ...r, ...changes } : r));
    const revalidated = rolesCatalog.validate(updated);
    dispatch({ type: 'S2_SET_CATALOG', payload: revalidated });
  }

  const summary = rolesCatalog.summary(step2.catalog);
  const noneOpt = { value: NONE_VALUE, label: '— Seleccioná una columna —' };
  const headerOptions = effectiveSource
    ? [
        noneOpt,
        ...effectiveSource.headers
          .filter(Boolean)
          .map((h) => ({ value: h, label: h }))
          .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })),
      ]
    : [noneOpt];

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        Paso 2: Catálogo de roles
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Seleccioná la columna que contiene los roles del archivo.
      </Typography>

      <Card variant="outlined" sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Archivo fuente
          </Typography>
          <SourceFileChoice
            step1FileName={step1.source?.fileName ?? ''}
            mode={step2.sourceData.mode}
            onSameFile={handleSameFile}
            onOtherFile={handleOtherFile}
            currentOtherFileName={
              step2.sourceData.mode === 'other' ? step2.sourceData.fileName : undefined
            }
          />
        </CardContent>
      </Card>

      {effectiveSource && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Columna de roles *</InputLabel>
            <Select
              value={step2.selectedColumn}
              label="Columna de roles *"
              onChange={(e) => handleColumnChange(e.target.value)}
            >
              {headerOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {step2.catalog.length > 0 && (
        <Box>
          <ValidationSummaryBanner
            total={summary.total}
            valid={summary.valid}
            invalid={summary.invalid}
            hasErrors={summary.hasErrors}
            label="roles"
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {step2.catalog.map((role) => (
              <Card
                key={role.id}
                variant="outlined"
                sx={{ borderRadius: 2, borderColor: role.valid ? 'divider' : 'error.light' }}
              >
                <CardContent sx={{ py: '8px !important', px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <CharCounterInput
                        value={role.name}
                        onChange={(v) => handleRoleChange(role.id, { name: v })}
                        maxLength={40}
                        label="Nombre del rol"
                        error={!role.valid}
                      />
                    </Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={role.hasReports}
                          onChange={(e) => handleRoleChange(role.id, { hasReports: e.target.checked })}
                        />
                      }
                      label={<Typography variant="body2">Tiene reportes</Typography>}
                    />
                    {!role.valid && (
                      <Chip
                        label={role.errors.join(' · ')}
                        size="small"
                        color="error"
                        sx={{ maxWidth: 300 }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {effectiveSource && step2.selectedColumn === NONE_VALUE && (
        <Box
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Seleccioná una columna para ver el catálogo de roles
          </Typography>
        </Box>
      )}
    </Box>
  );
}
