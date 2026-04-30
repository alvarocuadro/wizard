import { useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import { FileUploadZone } from '../ui/FileUploadZone';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { useFileParser } from '../../hooks/useFileParser';
import { useColumnDetection } from '../../hooks/useColumnDetection';
import { useRowValidation } from '../../hooks/useRowValidation';
import { useWizardContext } from '../../context/WizardContext';
import { FIELDS, REQUIRED_FIELDS } from '../../utils/fields';
import { NONE_VALUE, WORK_MODE_VALUES } from '../../utils/constants';
import type { CellValue, FieldMapping, WorkModeValueMap, ValidationResult } from '../../utils/types';

export function Step1Panel() {
  const { state, dispatch } = useWizardContext();
  const { step1 } = state;
  const { parse, loading, error } = useFileParser();
  const { detectMappings } = useColumnDetection();
  const { validateAll, buildProcessedRows } = useRowValidation();

  const runValidation = useCallback(
    (rows: CellValue[][], headers: string[], mapping: FieldMapping, wm: WorkModeValueMap) => {
      const results = validateAll(rows, mapping, headers, wm);
      const processedRows = buildProcessedRows(results);
      dispatch({ type: 'S1_SET_VALIDATION', payload: { results, processedRows } });
    },
    [validateAll, buildProcessedRows, dispatch]
  );

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const result = await parse(file);
        dispatch({ type: 'S1_SET_SOURCE', payload: result });
        dispatch({ type: 'RESET_FROM_STEP', payload: 2 });
        const mapping = detectMappings(result.headers);
        dispatch({ type: 'S1_SET_MAPPING', payload: mapping });
        runValidation(result.rows, result.headers, mapping, step1.workModeValueMap);
      } catch {
        // error displayed in FileUploadZone
      }
    },
    [parse, dispatch, detectMappings, runValidation, step1.workModeValueMap]
  );

  function handleMappingChange(fieldKey: string, value: string) {
    const newMapping: FieldMapping = { ...step1.mapping, [fieldKey]: value };
    dispatch({ type: 'S1_SET_MAPPING', payload: newMapping });
    dispatch({ type: 'RESET_FROM_STEP', payload: 2 });
  }

  function handleWorkModeChange(key: keyof WorkModeValueMap, value: string) {
    dispatch({
      type: 'S1_SET_WORKMODE_MAP',
      payload: { ...step1.workModeValueMap, [key]: value },
    });
  }

  function handleRevalidate() {
    if (!step1.source) return;
    runValidation(step1.source.rows, step1.source.headers, step1.mapping, step1.workModeValueMap);
  }

  function handleChangeFile() {
    dispatch({ type: 'S1_SET_SOURCE', payload: { fileName: '', headers: [], rows: [] } });
    dispatch({ type: 'S1_RESET_VALIDATION' });
    dispatch({ type: 'RESET_FROM_STEP', payload: 2 });
  }

  if (!step1.source || !step1.source.fileName) {
    return (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Paso 1: Carga de miembros
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Subí el archivo con la información de los empleados (Excel o CSV).
        </Typography>
        <FileUploadZone onFile={handleFile} loading={loading} error={error} />
      </Box>
    );
  }

  const { source, mapping, workModeValueMap, validationResults } = step1;
  const noneOpt = { value: NONE_VALUE, label: '— No mapear —' };
  const headerOptions = [
    noneOpt,
    ...source.headers
      .filter(Boolean)
      .map((h) => ({ value: h, label: h }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })),
  ];

  const mappedRequired = REQUIRED_FIELDS.filter(
    (f) => mapping[f.key] && mapping[f.key] !== NONE_VALUE
  ).length;
  const allRequiredMapped = mappedRequired === REQUIRED_FIELDS.length;
  const workModeIsMapped = mapping['workMode'] && mapping['workMode'] !== NONE_VALUE;

  const validCount = validationResults.filter((r) => r.valid && !r.omitted).length;
  const invalidResults = validationResults.filter((r) => !r.valid);

  return (
    <Box>
      {/* File info */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent
          sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important', px: 2 }}
        >
          <CheckCircleIcon color="success" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {source.fileName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {source.rows.length} filas · {source.headers.length} columnas detectadas
            </Typography>
          </Box>
          <Button size="small" variant="outlined" color="error" onClick={handleChangeFile}>
            Cambiar archivo
          </Button>
        </CardContent>
      </Card>

      {/* Field mapping */}
      <Accordion
        defaultExpanded
        sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Mapeo de campos</Typography>
          <Chip
            label={`${mappedRequired}/${REQUIRED_FIELDS.length} obligatorios`}
            size="small"
            sx={{ ml: 2 }}
            color={allRequiredMapped ? 'success' : 'warning'}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {FIELDS.map((field) => {
              const current = mapping[field.key] ?? NONE_VALUE;
              const isMapped = current !== NONE_VALUE;
              return (
                <Grid key={field.key} size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>
                      {field.label}
                      {field.required && (
                        <Box component="span" sx={{ color: 'error.main' }}> *</Box>
                      )}
                    </InputLabel>
                    <Select
                      value={current}
                      label={`${field.label}${field.required ? ' *' : ''}`}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      sx={{ bgcolor: isMapped ? 'success.light' : undefined }}
                    >
                      {headerOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              );
            })}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* WorkMode aliases */}
      {workModeIsMapped && (
        <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 700 }}>Alias de modalidad de trabajo</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Si tu archivo usa valores distintos, indicá cómo se llama cada modalidad:
            </Typography>
            <Grid container spacing={2}>
              {WORK_MODE_VALUES.map((mode) => (
                <Grid key={mode} size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label={`Alias para "${mode}"`}
                    placeholder={mode}
                    value={workModeValueMap[mode as keyof WorkModeValueMap] ?? ''}
                    onChange={(e) =>
                      handleWorkModeChange(mode as keyof WorkModeValueMap, e.target.value)
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Re-validate button */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRevalidate}
          size="small"
        >
          Re-validar datos
        </Button>
        {validationResults.length > 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {validCount} filas válidas de {validationResults.length}
          </Typography>
        )}
      </Box>

      {/* Validation results */}
      {validationResults.length > 0 && (
        <Box>
          <ValidationSummaryBanner
            total={validationResults.length}
            valid={validCount}
            invalid={invalidResults.length}
            hasErrors={invalidResults.length > 0}
            label="filas"
          />
          {invalidResults.length > 0 && (
            <Accordion sx={{ borderRadius: '12px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 600, color: 'warning.dark' }}>
                  {invalidResults.length} filas con errores (no se exportarán)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {invalidResults.slice(0, 20).map((result) => {
                  const idx = validationResults.indexOf(result);
                  return (
                    <InvalidRowCard
                      key={result.rowNumber}
                      result={result}
                      index={idx}
                      onUpdate={(i, normalized) =>
                        dispatch({ type: 'S1_UPDATE_ROW', payload: { index: i, normalized } })
                      }
                      onToggleOmit={(i) => dispatch({ type: 'S1_TOGGLE_OMIT', payload: i })}
                    />
                  );
                })}
                {invalidResults.length > 20 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    ... y {invalidResults.length - 20} filas más con errores
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Box>
  );
}

interface InvalidRowCardProps {
  result: ValidationResult;
  index: number;
  onUpdate: (index: number, normalized: Record<string, string>) => void;
  onToggleOmit: (index: number) => void;
}

function InvalidRowCard({ result, index, onUpdate, onToggleOmit }: InvalidRowCardProps) {
  const errorFieldLabels = new Set(result.errors.map((e) => e.split(':')[0].trim()));
  const editableFields = FIELDS.filter((f) => errorFieldLabels.has(f.label));

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: 2,
        borderColor: result.omitted ? 'divider' : 'warning.light',
        opacity: result.omitted ? 0.6 : 1,
      }}
    >
      <CardContent sx={{ py: '10px !important', px: 2 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.dark' }}>
            Fila {result.rowNumber}
          </Typography>
          <Button
            size="small"
            variant="text"
            color={result.omitted ? 'primary' : 'warning'}
            onClick={() => onToggleOmit(index)}
            sx={{ py: 0, minHeight: 0 }}
          >
            {result.omitted ? 'Incluir' : 'Omitir fila'}
          </Button>
        </Box>

        {result.errors.map((e) => (
          <Typography key={e} variant="caption" sx={{ color: 'error.main', display: 'block' }}>
            • {e}
          </Typography>
        ))}

        {editableFields.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={1}>
              {editableFields.map((field) => (
                <Grid key={field.key} size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label={field.label}
                    value={result.normalized[field.key] ?? ''}
                    disabled={result.omitted}
                    onChange={(e) =>
                      onUpdate(index, { ...result.normalized, [field.key]: e.target.value })
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );
}
