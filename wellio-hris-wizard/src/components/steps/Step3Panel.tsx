import { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { SourceFileChoice } from './SourceFileChoice';
import { TeamHierarchyBuilder } from './TeamHierarchyBuilder';
import { SheetSelector } from '../ui/SheetSelector';
import { useWizardContext } from '../../context/WizardContext';
import { useColumnDetection } from '../../hooks/useColumnDetection';
import { useTeamsCatalog } from '../../hooks/useTeamsCatalog';
import { parseSheet } from '../../utils/workbookCache';
import { NONE_VALUE } from '../../utils/constants';
import type { FileParseResult, TeamCatalogItem } from '../../utils/types';

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

export function Step3Panel() {
  const { state, dispatch } = useWizardContext();
  const { step1, step3 } = state;
  const { detectTeamColumn } = useColumnDetection();
  const teamsCatalog = useTeamsCatalog();
  const initialDetectDone = useRef(false);

  const effectiveSource =
    step3.sourceData.mode === 'same' && step1.source
      ? (step3.sourceData.sheetName ? step3.sourceData : step1.source)
      : step3.sourceData.headers.length > 0
        ? step3.sourceData
        : null;

  useEffect(() => {
    if (initialDetectDone.current || !effectiveSource || step3.selectedColumn !== NONE_VALUE) return;
    initialDetectDone.current = true;
    const column = detectTeamColumn(effectiveSource.headers);
    dispatch({ type: 'S3_SET_COLUMN', payload: column });
    if (column !== NONE_VALUE) {
      const catalog = teamsCatalog.build(effectiveSource.rows, effectiveSource.headers, column, []);
      dispatch({ type: 'S3_SET_CATALOG', payload: catalog });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSameFile() {
    dispatch({
      type: 'S3_SET_SOURCE_DATA',
      payload: { mode: 'same', fileName: '', sheetName: '', sheetNames: [], headers: [], rows: [] },
    });
    dispatch({ type: 'S3_SET_COLUMN', payload: NONE_VALUE });
    dispatch({ type: 'S3_SET_CATALOG', payload: [] });
    dispatch({ type: 'RESET_FROM_STEP', payload: 4 });
    initialDetectDone.current = false;
  }

  function handleSheetChange(sheetName: string) {
    const mode = step3.sourceData.mode;
    const fileName = mode === 'same' ? (step1.source?.fileName ?? '') : step3.sourceData.fileName;
    const sheetNames = mode === 'same' ? (step1.source?.sheetNames ?? []) : step3.sourceData.sheetNames;
    const sheetData = parseSheet(fileName, sheetName);
    if (!sheetData) return;
    dispatch({ type: 'S3_SET_SOURCE_DATA', payload: { mode, fileName, sheetName, sheetNames, headers: sheetData.headers, rows: sheetData.rows } });
    dispatch({ type: 'S3_SET_COLUMN', payload: NONE_VALUE });
    dispatch({ type: 'S3_SET_CATALOG', payload: [] });
    dispatch({ type: 'RESET_FROM_STEP', payload: 4 });
    initialDetectDone.current = false;
  }

  function handleOtherFile(result: FileParseResult) {
    if (!result.headers.length) return;
    dispatch({ type: 'S3_SET_SOURCE_DATA', payload: { mode: 'other', ...result } });
    const column = detectTeamColumn(result.headers);
    dispatch({ type: 'S3_SET_COLUMN', payload: column });
    if (column !== NONE_VALUE) {
      const catalog = teamsCatalog.build(result.rows, result.headers, column, []);
      dispatch({ type: 'S3_SET_CATALOG', payload: catalog });
    } else {
      dispatch({ type: 'S3_SET_CATALOG', payload: [] });
    }
    dispatch({ type: 'RESET_FROM_STEP', payload: 4 });
  }

  function handleColumnChange(column: string) {
    dispatch({ type: 'S3_SET_COLUMN', payload: column });
    if (!effectiveSource) return;
    if (column !== NONE_VALUE) {
      const catalog = teamsCatalog.build(
        effectiveSource.rows,
        effectiveSource.headers,
        column,
        step3.catalog
      );
      dispatch({ type: 'S3_SET_CATALOG', payload: catalog });
    } else {
      dispatch({ type: 'S3_SET_CATALOG', payload: [] });
    }
    dispatch({ type: 'RESET_FROM_STEP', payload: 4 });
  }

  function handleTeamChange(id: string, changes: Partial<TeamCatalogItem>) {
    let updated = step3.catalog.map((team) => (team.id === id ? { ...team, ...changes } : team));
    if (changes.isMain === true) {
      updated = updated.map((team) => (team.id === id ? team : { ...team, isMain: false }));
    }
    const revalidated = teamsCatalog.revalidate(updated);
    dispatch({ type: 'S3_SET_CATALOG', payload: revalidated });
    dispatch({ type: 'RESET_FROM_STEP', payload: 4 });
  }

  const summary = teamsCatalog.summary(step3.catalog);

  const noneOption = { value: NONE_VALUE, label: '— Seleccioná una columna —' };
  const headerOptions = effectiveSource
    ? [
        noneOption,
        ...effectiveSource.headers
          .filter(Boolean)
          .map((header) => ({ value: header, label: header }))
          .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })),
      ]
    : [noneOption];

  return (
    <Box>
      <StepHeader
        step={3}
        title="Equipos"
        subtitle="Seleccioná la columna de equipos y armá la jerarquía arrastrando los nodos del árbol."
      />

      <SectionCard>
        <SectionHeader>Archivo fuente</SectionHeader>
        <Box sx={{ p: 3 }}>
          <SourceFileChoice
            step1FileName={step1.source?.fileName ?? ''}
            mode={step3.sourceData.mode}
            onSameFile={handleSameFile}
            onOtherFile={handleOtherFile}
            currentOtherFileName={
              step3.sourceData.mode === 'other' ? step3.sourceData.fileName : undefined
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
          <SectionHeader>Columna de equipos</SectionHeader>
          <Box sx={{ p: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Columna de equipos *</InputLabel>
              <Select
                value={step3.selectedColumn}
                label="Columna de equipos *"
                onChange={(event) => handleColumnChange(event.target.value)}
                sx={{ borderRadius: '10px' }}
              >
                {headerOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </SectionCard>
      )}

      {effectiveSource && step3.selectedColumn === NONE_VALUE && (
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
            Seleccioná una columna para ver el catálogo de equipos
          </Typography>
        </Box>
      )}

      {step3.catalog.length > 0 && (
        <Box>
          <ValidationSummaryBanner
            total={summary.total}
            valid={summary.valid}
            invalid={summary.invalid}
            hasErrors={summary.hasErrors}
            label="equipos"
          />

          {summary.hasLoop && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2.5,
                py: 1.5,
                mb: 2,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'error.main',
                bgcolor: '#FEF2F2',
              }}
            >
              <WarningAmberIcon sx={{ fontSize: 18, color: 'error.main', flexShrink: 0 }} />
              <Typography sx={{ fontSize: '13px', fontWeight: 500, color: 'error.dark' }}>
                Se detectó una dependencia circular en la jerarquía. Revisá los equipos padre asignados.
              </Typography>
            </Box>
          )}

          <SectionCard sx={{ mb: 0 }}>
            <SectionHeader>Jerarquía de equipos</SectionHeader>
            <Box sx={{ p: 3 }}>
              <TeamHierarchyBuilder
                catalog={step3.catalog}
                onTeamChange={handleTeamChange}
              />
            </Box>
          </SectionCard>
        </Box>
      )}
    </Box>
  );
}
