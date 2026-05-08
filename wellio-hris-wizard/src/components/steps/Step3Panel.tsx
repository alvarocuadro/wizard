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
  Alert,
} from '@mui/material';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { SourceFileChoice } from './SourceFileChoice';
import { TeamHierarchyBuilder } from './TeamHierarchyBuilder';
import { useWizardContext } from '../../context/WizardContext';
import { useColumnDetection } from '../../hooks/useColumnDetection';
import { useTeamsCatalog } from '../../hooks/useTeamsCatalog';
import { NONE_VALUE } from '../../utils/constants';
import type { FileParseResult, TeamCatalogItem } from '../../utils/types';

export function Step3Panel() {
  const { state, dispatch } = useWizardContext();
  const { step1, step3 } = state;
  const { detectTeamColumn } = useColumnDetection();
  const teamsCatalog = useTeamsCatalog();
  const initialDetectDone = useRef(false);

  const effectiveSource =
    step3.sourceData.mode === 'same' && step1.source
      ? step1.source
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
      payload: { mode: 'same', fileName: '', headers: [], rows: [] },
    });
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

  const noneOption = { value: NONE_VALUE, label: '--- Selecciona una columna ---' };
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
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        Paso 3: Equipos
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Seleccioná la columna de equipos y armá la jerarquía arrastrando los nodos del árbol.
      </Typography>

      {/* Source file */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Archivo fuente
          </Typography>
          <SourceFileChoice
            step1FileName={step1.source?.fileName ?? ''}
            mode={step3.sourceData.mode}
            onSameFile={handleSameFile}
            onOtherFile={handleOtherFile}
            currentOtherFileName={
              step3.sourceData.mode === 'other' ? step3.sourceData.fileName : undefined
            }
          />
        </CardContent>
      </Card>

      {/* Column selector */}
      {effectiveSource && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Columna de equipos *</InputLabel>
            <Select
              value={step3.selectedColumn}
              label="Columna de equipos *"
              onChange={(event) => handleColumnChange(event.target.value)}
            >
              {headerOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Empty state */}
      {effectiveSource && step3.selectedColumn === NONE_VALUE && (
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
            Seleccioná una columna para ver el catálogo de equipos
          </Typography>
        </Box>
      )}

      {/* Catalog: validation banner + loop alert + DnD tree */}
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
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              Se detectó una dependencia circular en la jerarquía. Revisá los equipos padre asignados.
            </Alert>
          )}

          <TeamHierarchyBuilder
            catalog={step3.catalog}
            onTeamChange={handleTeamChange}
          />
        </Box>
      )}
    </Box>
  );
}
