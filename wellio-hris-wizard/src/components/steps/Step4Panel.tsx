import { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
} from '@mui/material';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { SourceFileChoice } from './SourceFileChoice';
import { SheetSelector } from '../ui/SheetSelector';
import { useWizardContext } from '../../context/WizardContext';
import { useColumnDetection } from '../../hooks/useColumnDetection';
import { useAssignmentsCatalog } from '../../hooks/useAssignmentsCatalog';
import { parseSheet } from '../../utils/workbookCache';
import { NONE_VALUE } from '../../utils/constants';
import type { FileParseResult, AssignmentColumnMapping } from '../../utils/types';

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

export function Step4Panel() {
  const { state, dispatch } = useWizardContext();
  const { step1, step2, step3, step4 } = state;
  const { detectAssignmentColumns } = useColumnDetection();
  const assignmentsCatalog = useAssignmentsCatalog();
  const initialDetectDone = useRef(false);

  const effectiveSource =
    step4.sourceData.mode === 'same' && step1.source
      ? (step4.sourceData.sheetName ? step4.sourceData : step1.source)
      : step4.sourceData.headers.length > 0
      ? step4.sourceData
      : null;

  useEffect(() => {
    if (initialDetectDone.current || !effectiveSource) return;
    const allMapped =
      step4.columnMapping.member !== NONE_VALUE &&
      step4.columnMapping.role !== NONE_VALUE &&
      step4.columnMapping.team !== NONE_VALUE;
    if (allMapped) { initialDetectDone.current = true; return; }
    initialDetectDone.current = true;
    const mapping = detectAssignmentColumns(effectiveSource.headers);
    dispatch({ type: 'S4_SET_COLUMN_MAPPING', payload: mapping });
    const allSet =
      mapping.member !== NONE_VALUE && mapping.role !== NONE_VALUE && mapping.team !== NONE_VALUE;
    if (allSet) {
      const catalog = assignmentsCatalog.build(
        effectiveSource.rows,
        effectiveSource.headers,
        mapping,
        step1,
        step2.catalog,
        step3.catalog
      );
      dispatch({ type: 'S4_SET_CATALOG', payload: catalog });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSameFile() {
    dispatch({ type: 'S4_SET_SOURCE_DATA', payload: { mode: 'same', fileName: '', sheetName: '', sheetNames: [], headers: [], rows: [] } });
    dispatch({ type: 'S4_SET_COLUMN_MAPPING', payload: { member: NONE_VALUE, role: NONE_VALUE, team: NONE_VALUE } });
    dispatch({ type: 'S4_SET_CATALOG', payload: [] });
    dispatch({ type: 'RESET_FROM_STEP', payload: 5 });
    initialDetectDone.current = false;
  }

  function handleSheetChange(sheetName: string) {
    const mode = step4.sourceData.mode;
    const fileName = mode === 'same' ? (step1.source?.fileName ?? '') : step4.sourceData.fileName;
    const sheetNames = mode === 'same' ? (step1.source?.sheetNames ?? []) : step4.sourceData.sheetNames;
    const sheetData = parseSheet(fileName, sheetName);
    if (!sheetData) return;
    dispatch({ type: 'S4_SET_SOURCE_DATA', payload: { mode, fileName, sheetName, sheetNames, headers: sheetData.headers, rows: sheetData.rows } });
    dispatch({ type: 'S4_SET_COLUMN_MAPPING', payload: { member: NONE_VALUE, role: NONE_VALUE, team: NONE_VALUE } });
    dispatch({ type: 'S4_SET_CATALOG', payload: [] });
    dispatch({ type: 'RESET_FROM_STEP', payload: 5 });
    initialDetectDone.current = false;
  }

  function handleOtherFile(result: FileParseResult) {
    if (!result.headers.length) return;
    dispatch({ type: 'S4_SET_SOURCE_DATA', payload: { mode: 'other', ...result } });
    const mapping = detectAssignmentColumns(result.headers);
    dispatch({ type: 'S4_SET_COLUMN_MAPPING', payload: mapping });
    const allSet =
      mapping.member !== NONE_VALUE && mapping.role !== NONE_VALUE && mapping.team !== NONE_VALUE;
    if (allSet) {
      const catalog = assignmentsCatalog.build(
        result.rows, result.headers, mapping, step1, step2.catalog, step3.catalog
      );
      dispatch({ type: 'S4_SET_CATALOG', payload: catalog });
    } else {
      dispatch({ type: 'S4_SET_CATALOG', payload: [] });
    }
    dispatch({ type: 'RESET_FROM_STEP', payload: 5 });
  }

  function handleMappingChange(key: keyof AssignmentColumnMapping, value: string) {
    const newMapping: AssignmentColumnMapping = { ...step4.columnMapping, [key]: value };
    dispatch({ type: 'S4_SET_COLUMN_MAPPING', payload: newMapping });
    if (!effectiveSource) return;
    const allSet =
      newMapping.member !== NONE_VALUE &&
      newMapping.role !== NONE_VALUE &&
      newMapping.team !== NONE_VALUE;
    if (allSet) {
      const catalog = assignmentsCatalog.build(
        effectiveSource.rows, effectiveSource.headers, newMapping, step1, step2.catalog, step3.catalog
      );
      dispatch({ type: 'S4_SET_CATALOG', payload: catalog });
    } else {
      dispatch({ type: 'S4_SET_CATALOG', payload: [] });
    }
    dispatch({ type: 'RESET_FROM_STEP', payload: 5 });
  }

  const summary = assignmentsCatalog.summary(step4.catalog);

  const noneOpt = { value: NONE_VALUE, label: '— No seleccionado —' };
  const headerOptions = effectiveSource
    ? [
        noneOpt,
        ...effectiveSource.headers
          .filter(Boolean)
          .map((h) => ({ value: h, label: h }))
          .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })),
      ]
    : [noneOpt];

  const MAPPING_LABELS: Record<keyof AssignmentColumnMapping, string> = {
    member: 'Columna de miembro *',
    role: 'Columna de rol *',
    team: 'Columna de equipo *',
  };

  const invalidItems = step4.catalog.filter((a) => !a.valid);

  return (
    <Box>
      <StepHeader
        step={4}
        title="Puestos y asignaciones"
        subtitle="Mapeá las columnas de miembro, rol y equipo para construir las asignaciones."
      />

      <SectionCard>
        <SectionHeader>Archivo fuente</SectionHeader>
        <Box sx={{ p: 3 }}>
          <SourceFileChoice
            step1FileName={step1.source?.fileName ?? ''}
            mode={step4.sourceData.mode}
            onSameFile={handleSameFile}
            onOtherFile={handleOtherFile}
            currentOtherFileName={
              step4.sourceData.mode === 'other' ? step4.sourceData.fileName : undefined
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
          <SectionHeader>Mapeo de columnas</SectionHeader>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {(Object.keys(MAPPING_LABELS) as (keyof AssignmentColumnMapping)[]).map((key) => (
                <Grid key={key} size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{MAPPING_LABELS[key]}</InputLabel>
                    <Select
                      value={step4.columnMapping[key]}
                      label={MAPPING_LABELS[key]}
                      onChange={(e) => handleMappingChange(key, e.target.value)}
                      sx={{ borderRadius: '10px' }}
                    >
                      {headerOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Box>
        </SectionCard>
      )}

      {step4.catalog.length > 0 && (
        <Box>
          <ValidationSummaryBanner
            total={summary.total}
            valid={summary.valid}
            invalid={summary.invalid}
            hasErrors={summary.hasErrors}
            label="asignaciones"
          />

          {invalidItems.length > 0 && (
            <SectionCard>
              <SectionHeader>
                Asignaciones con errores ({invalidItems.length})
              </SectionHeader>
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {invalidItems.slice(0, 15).map((item) => (
                  <Box
                    key={item.sourceRow}
                    sx={{
                      border: '1px solid',
                      borderColor: 'warning.light',
                      borderRadius: '10px',
                      px: 2,
                      py: 1.5,
                      bgcolor: '#FFFBEB',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 0.5 }}>
                      <Chip
                        label={`Fila ${item.sourceRow}`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '11px',
                          fontWeight: 700,
                          bgcolor: '#6B7280',
                          color: '#fff',
                          borderRadius: '999px',
                        }}
                      />
                      <Typography sx={{ fontSize: '13px', color: '#374151' }}>
                        {item.member || '(sin nombre)'}
                      </Typography>
                      <Typography sx={{ fontSize: '13px', color: '#9CA3AF' }}>·</Typography>
                      <Typography sx={{ fontSize: '13px', color: '#374151' }}>
                        {item.role || '(sin rol)'}
                      </Typography>
                      <Typography sx={{ fontSize: '13px', color: '#9CA3AF' }}>·</Typography>
                      <Typography sx={{ fontSize: '13px', color: '#374151' }}>
                        {item.team || '(sin equipo)'}
                      </Typography>
                    </Box>
                    {item.errors.map((e) => (
                      <Typography key={e} sx={{ fontSize: '12px', color: 'error.main', display: 'block' }}>
                        • {e}
                      </Typography>
                    ))}
                  </Box>
                ))}
                {invalidItems.length > 15 && (
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                    ... y {invalidItems.length - 15} asignaciones más con errores
                  </Typography>
                )}
              </Box>
            </SectionCard>
          )}
        </Box>
      )}
    </Box>
  );
}
