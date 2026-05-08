import { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
} from '@mui/material';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { SourceFileChoice } from './SourceFileChoice';
import { CharCounterInput } from '../ui/CharCounterInput';
import { SheetSelector } from '../ui/SheetSelector';
import { useWizardContext } from '../../context/WizardContext';
import { useColumnDetection } from '../../hooks/useColumnDetection';
import { useRolesCatalog } from '../../hooks/useRolesCatalog';
import { parseSheet } from '../../utils/workbookCache';
import { NONE_VALUE } from '../../utils/constants';
import type { FileParseResult, RoleCatalogItem } from '../../utils/types';

function SectionCard({ children, sx = {} }: { children: React.ReactNode; sx?: object }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        mb: 3,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#FAFAFA' }}>
      <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>
        {children}
      </Typography>
    </Box>
  );
}

function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <Box
          sx={{
            width: 28, height: 28,
            borderRadius: '8px',
            bgcolor: 'primary.light',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: '12px', fontWeight: 800, color: 'primary.main', lineHeight: 1 }}>
            {step}
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#6B7280', pl: '42px' }}>
        {subtitle}
      </Typography>
    </Box>
  );
}

export function Step2Panel() {
  const { state, dispatch } = useWizardContext();
  const { step1, step2 } = state;
  const { detectRoleColumn } = useColumnDetection();
  const rolesCatalog = useRolesCatalog();
  const initialDetectDone = useRef(false);

  const effectiveSource =
    step2.sourceData.mode === 'same' && step1.source
      ? (step2.sourceData.sheetName ? step2.sourceData : step1.source)
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
    dispatch({ type: 'S2_SET_SOURCE_DATA', payload: { mode: 'same', fileName: '', sheetName: '', sheetNames: [], headers: [], rows: [] } });
    dispatch({ type: 'S2_SET_COLUMN', payload: NONE_VALUE });
    dispatch({ type: 'S2_SET_CATALOG', payload: [] });
    dispatch({ type: 'RESET_FROM_STEP', payload: 3 });
    initialDetectDone.current = false;
  }

  function handleSheetChange(sheetName: string) {
    const mode = step2.sourceData.mode;
    const fileName = mode === 'same' ? (step1.source?.fileName ?? '') : step2.sourceData.fileName;
    const sheetNames = mode === 'same' ? (step1.source?.sheetNames ?? []) : step2.sourceData.sheetNames;
    const sheetData = parseSheet(fileName, sheetName);
    if (!sheetData) return;
    dispatch({ type: 'S2_SET_SOURCE_DATA', payload: { mode, fileName, sheetName, sheetNames, headers: sheetData.headers, rows: sheetData.rows } });
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
      <StepHeader
        step={2}
        title="Catálogo de roles"
        subtitle="Seleccioná la columna que contiene los roles del archivo."
      />

      <SectionCard>
        <SectionHeader>Archivo fuente</SectionHeader>
        <Box sx={{ p: 3 }}>
          <SourceFileChoice
            step1FileName={step1.source?.fileName ?? ''}
            mode={step2.sourceData.mode}
            onSameFile={handleSameFile}
            onOtherFile={handleOtherFile}
            currentOtherFileName={
              step2.sourceData.mode === 'other' ? step2.sourceData.fileName : undefined
            }
          />
          {effectiveSource && (
            <SheetSelector
              sheetNames={effectiveSource.sheetNames}
              value={effectiveSource.sheetName}
              onChange={handleSheetChange}
            />
          )}
        </Box>
      </SectionCard>

      {effectiveSource && (
        <SectionCard>
          <SectionHeader>Columna de roles</SectionHeader>
          <Box sx={{ p: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Columna de roles *</InputLabel>
              <Select
                value={step2.selectedColumn}
                label="Columna de roles *"
                onChange={(e) => handleColumnChange(e.target.value)}
                sx={{ borderRadius: '10px' }}
              >
                {headerOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </SectionCard>
      )}

      {effectiveSource && step2.selectedColumn === NONE_VALUE && (
        <Box
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: '12px',
            p: 4,
            textAlign: 'center',
            mb: 3,
          }}
        >
          <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
            Seleccioná una columna para ver el catálogo de roles
          </Typography>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {step2.catalog.map((role) => (
              <Box
                key={role.id}
                sx={{
                  border: '1px solid',
                  borderColor: role.valid ? 'divider' : 'error.light',
                  borderRadius: '10px',
                  px: 2,
                  py: 1.5,
                  bgcolor: role.valid ? 'background.paper' : '#FFF5F5',
                }}
              >
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
                        sx={{ color: 'primary.main' }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '13px', color: '#374151' }}>
                        Tiene reportes
                      </Typography>
                    }
                  />
                  {!role.valid && (
                    <Chip
                      label={role.errors.join(' · ')}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '11px',
                        fontWeight: 600,
                        bgcolor: 'error.main',
                        color: '#fff',
                        borderRadius: '999px',
                        maxWidth: 300,
                      }}
                    />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
