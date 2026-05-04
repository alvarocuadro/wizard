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
  Grid,
  Chip,
} from '@mui/material';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { SourceFileChoice } from './SourceFileChoice';
import { useWizardContext } from '../../context/WizardContext';
import { useColumnDetection } from '../../hooks/useColumnDetection';
import { useAssignmentsCatalog } from '../../hooks/useAssignmentsCatalog';
import { NONE_VALUE } from '../../utils/constants';
import type { FileParseResult, AssignmentColumnMapping } from '../../utils/types';

export function Step4Panel() {
  const { state, dispatch } = useWizardContext();
  const { step1, step2, step3, step4 } = state;
  const { detectAssignmentColumns } = useColumnDetection();
  const assignmentsCatalog = useAssignmentsCatalog();
  const initialDetectDone = useRef(false);

  const effectiveSource =
    step4.sourceData.mode === 'same' && step1.source
      ? step1.source
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
    dispatch({
      type: 'S4_SET_SOURCE_DATA',
      payload: {
        mode: 'same',
        fileName: '',
        headers: [],
        rows: [],
        headerRowNumber: 1,
        dataStartRowNumber: 2,
      },
    });
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
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        Paso 4: Puestos y asignaciones
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Mapeá las columnas de miembro, rol y equipo para construir las asignaciones.
      </Typography>

      <Card variant="outlined" sx={{ mb: 4, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Archivo fuente
          </Typography>
          <SourceFileChoice
            step1FileName={step1.source?.fileName ?? ''}
            mode={step4.sourceData.mode}
            onSameFile={handleSameFile}
            onOtherFile={handleOtherFile}
            currentOtherFileName={
              step4.sourceData.mode === 'other' ? step4.sourceData.fileName : undefined
            }
          />
        </CardContent>
      </Card>

      {effectiveSource && (
        <Card variant="outlined" sx={{ mb: 4, borderRadius: 4 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Mapeo de columnas
            </Typography>
            <Grid container columnSpacing={3} rowSpacing={2.5}>
              {(Object.keys(MAPPING_LABELS) as (keyof AssignmentColumnMapping)[]).map((key) => (
                <Grid key={key} size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{MAPPING_LABELS[key]}</InputLabel>
                    <Select
                      value={step4.columnMapping[key]}
                      label={MAPPING_LABELS[key]}
                      onChange={(e) => handleMappingChange(key, e.target.value)}
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
          </CardContent>
        </Card>
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
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'warning.dark' }}>
                Asignaciones con errores ({invalidItems.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {invalidItems.slice(0, 15).map((item) => (
                  <Card
                    key={item.sourceRow}
                    variant="outlined"
                    sx={{ borderRadius: 2, borderColor: 'warning.light' }}
                  >
                    <CardContent sx={{ py: '12px !important', px: 2.5 }}>
                      <Box
                        sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}
                      >
                        <Chip label={`Fila ${item.sourceRow}`} size="small" />
                        <Typography variant="caption">{item.member || '(sin nombre)'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>·</Typography>
                        <Typography variant="caption">{item.role || '(sin rol)'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>·</Typography>
                        <Typography variant="caption">{item.team || '(sin equipo)'}</Typography>
                      </Box>
                      {item.errors.map((e) => (
                        <Typography
                          key={e}
                          variant="caption"
                          sx={{ color: 'error.main', display: 'block' }}
                        >
                          • {e}
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                ))}
                {invalidItems.length > 15 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    ... y {invalidItems.length - 15} asignaciones más con errores
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
