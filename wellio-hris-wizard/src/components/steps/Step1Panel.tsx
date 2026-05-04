import { useCallback } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import { FileUploadZone } from '../ui/FileUploadZone';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { useFileParser } from '../../hooks/useFileParser';
import { normalizeDatePreview, useRowValidation } from '../../hooks/useRowValidation';
import { useWizardContext } from '../../context/WizardContext';
import { FIELDS } from '../../utils/fields';
import { NONE_VALUE, WORK_MODE_VALUES } from '../../utils/constants';
import { buildStep1TemplateMapping } from '../../utils/step1Template';
import type {
  CellValue,
  FieldDefaultValues,
  FieldMapping,
  NormalizedRow,
  ValidationResult,
  WorkModeValueMap,
} from '../../utils/types';

const EMPTY_DEFAULT_LABEL = '--- Sin valor ---';
const TEMPLATE_ACCEPT = '.xlsx,.xls,.csv,.xltx';

export function Step1Panel() {
  const { state, dispatch } = useWizardContext();
  const { step1 } = state;
  const { parse, loading, error } = useFileParser();
  const { validateAll, validateSingle, buildProcessedRows } = useRowValidation();

  const runValidation = useCallback(
    (
      rows: CellValue[][],
      headers: string[],
      mapping: FieldMapping,
      workModeMap: WorkModeValueMap,
      defaultValues: FieldDefaultValues,
      dataStartRowNumber: number
    ) => {
      const results = validateAll(
        rows,
        mapping,
        headers,
        workModeMap,
        defaultValues,
        dataStartRowNumber
      );
      const processedRows = buildProcessedRows(results);
      dispatch({ type: 'S1_SET_VALIDATION', payload: { results, processedRows } });
    },
    [validateAll, buildProcessedRows, dispatch]
  );

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const result = await parse(file, { mode: 'step1Template' });
        const mapping = buildStep1TemplateMapping(result.headers);

        dispatch({ type: 'S1_SET_SOURCE', payload: result });
        dispatch({ type: 'RESET_FROM_STEP', payload: 2 });
        dispatch({ type: 'S1_SET_MAPPING', payload: mapping });

        runValidation(
          result.rows,
          result.headers,
          mapping,
          step1.workModeValueMap,
          step1.defaultValues,
          result.dataStartRowNumber
        );
      } catch {
        // Error displayed by FileUploadZone
      }
    },
    [parse, dispatch, runValidation, step1.workModeValueMap, step1.defaultValues]
  );

  function handleWorkModeChange(key: keyof WorkModeValueMap, value: string) {
    const nextMap: WorkModeValueMap = { ...step1.workModeValueMap, [key]: value };
    dispatch({ type: 'S1_SET_WORKMODE_MAP', payload: nextMap });

    if (step1.source?.rows.length) {
      runValidation(
        step1.source.rows,
        step1.source.headers,
        step1.mapping,
        nextMap,
        step1.defaultValues,
        step1.source.dataStartRowNumber
      );
    }
  }

  function handleRevalidate() {
    if (step1.validationResults.length === 0) return;

    const results = step1.validationResults.map((result) => {
      const errors = validateSingle(result.normalized);
      return { ...result, errors, valid: errors.length === 0 };
    });
    const processedRows = buildProcessedRows(results);
    dispatch({ type: 'S1_SET_VALIDATION', payload: { results, processedRows } });
  }

  function handleChangeFile() {
    dispatch({
      type: 'S1_SET_SOURCE',
      payload: {
        fileName: '',
        headers: [],
        rows: [],
        headerRowNumber: 1,
        dataStartRowNumber: 2,
      },
    });
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
          Subi la plantilla de carga masiva con el formato requerido. La fila 1 debe
          contener los nombres de campo, la 2 un ejemplo y la 3 la referencia de
          obligatoriedad.
        </Typography>
        <FileUploadZone onFile={handleFile} loading={loading} error={error} accept={TEMPLATE_ACCEPT} />
      </Box>
    );
  }

  const { source, mapping, workModeValueMap, validationResults } = step1;
  const workModeHeader = mapping.workMode ?? NONE_VALUE;
  const workModeIsMapped = workModeHeader !== NONE_VALUE;
  const workModeColumnIndex = workModeIsMapped ? source.headers.indexOf(workModeHeader) : -1;
  const uniqueWmValues =
    workModeColumnIndex >= 0
      ? [
          ...new Set(
            source.rows
              .map((row) => String(row[workModeColumnIndex] ?? '').trim())
              .filter(Boolean)
          ),
        ].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
      : [];

  const previewFields = FIELDS.map((field) => {
    const columnName = mapping[field.key] ?? field.templateHeader;
    const columnIndex = source.headers.indexOf(columnName);
    const values =
      columnIndex >= 0
        ? [
            ...new Set(
              source.rows
                .slice(0, 8)
                .map((row) => {
                  const rawValue = row[columnIndex];
                  if (field.key === 'hireDate') {
                    return normalizeDatePreview(rawValue).trim();
                  }
                  return String(rawValue ?? '').trim();
                })
                .filter(Boolean)
            ),
          ]
        : [];

    return { field, columnName, values };
  });

  const validCount = validationResults.filter((result) => result.valid && !result.omitted).length;
  const invalidResults = validationResults.filter((result) => !result.valid);

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 4, borderRadius: 4 }}>
        <CardContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: '16px !important',
            px: 3,
          }}
        >
          <CheckCircleIcon color="success" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {source.fileName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {source.rows.length} filas de datos · {source.headers.length} columnas detectadas
            </Typography>
          </Box>
          <Button size="small" variant="outlined" color="error" onClick={handleChangeFile}>
            Cambiar archivo
          </Button>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            Vista previa
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Primeras filas del archivo para validar rapido si la plantilla fue completada
            correctamente.
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2.5 }}>
            Se toma la fila {source.headerRowNumber} como encabezado, se ignoran las filas{' '}
            {source.headerRowNumber + 1} y {source.headerRowNumber + 2} como ejemplo y referencia,
            y los datos se validan desde la fila {source.dataStartRowNumber}.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {previewFields.map(({ field, columnName, values }) => (
              <Box key={field.key}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {field.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {columnName}
                  </Typography>
                </Box>
                {values.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {values.map((value, index) => (
                      <Chip key={index} label={value} size="small" variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Todavia no hay valores cargados para esta columna.
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {workModeIsMapped && uniqueWmValues.length > 0 && (
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 4 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Valores de modalidad
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Indica a que modalidad canonica corresponde cada valor encontrado en el archivo.
            </Typography>
            <Grid container columnSpacing={3} rowSpacing={4}>
              {WORK_MODE_VALUES.map((mode) => (
                <Grid key={mode} size={{ xs: 12, sm: 4 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>{mode}</InputLabel>
                    <Select
                      value={workModeValueMap[mode as keyof WorkModeValueMap] ?? ''}
                      label={mode}
                      onChange={(event) =>
                        handleWorkModeChange(
                          mode as keyof WorkModeValueMap,
                          event.target.value
                        )
                      }
                    >
                      <MenuItem value="">{EMPTY_DEFAULT_LABEL}</MenuItem>
                      {uniqueWmValues.map((value) => (
                        <MenuItem key={value} value={value}>
                          {value}
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

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
            {validCount} filas validas de {validationResults.length}
          </Typography>
        )}
      </Box>

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
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 600, color: 'warning.dark' }}>
                  {invalidResults.length} filas con errores (no se exportaran)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {invalidResults.slice(0, 20).map((result) => {
                  const index = validationResults.indexOf(result);
                  return (
                    <InvalidRowCard
                      key={result.rowNumber}
                      result={result}
                      index={index}
                      validateSingle={validateSingle}
                      onUpdate={(targetIndex, normalized) =>
                        dispatch({
                          type: 'S1_UPDATE_ROW',
                          payload: { index: targetIndex, normalized },
                        })
                      }
                      onToggleOmit={(targetIndex) =>
                        dispatch({ type: 'S1_TOGGLE_OMIT', payload: targetIndex })
                      }
                    />
                  );
                })}
                {invalidResults.length > 20 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    ... y {invalidResults.length - 20} filas mas con errores
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
  validateSingle: (normalized: NormalizedRow) => string[];
  onUpdate: (index: number, normalized: Record<string, string>) => void;
  onToggleOmit: (index: number) => void;
}

function InvalidRowCard({
  result,
  index,
  validateSingle,
  onUpdate,
  onToggleOmit,
}: InvalidRowCardProps) {
  const errorFieldLabels = new Set(result.errors.map((error) => error.split(':')[0].trim()));
  const editableFields = FIELDS.filter((field) => errorFieldLabels.has(field.label));

  const currentErrors = new Set(validateSingle(result.normalized));
  const allResolved =
    result.errors.length > 0 && result.errors.every((error) => !currentErrors.has(error));

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: 3,
        borderColor: result.omitted ? 'divider' : allResolved ? 'success.main' : 'warning.light',
        backgroundColor: allResolved && !result.omitted ? 'success.light' : undefined,
        opacity: result.omitted ? 0.6 : 1,
      }}
    >
      <CardContent sx={{ py: '14px !important', px: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: allResolved ? 'success.dark' : 'warning.dark' }}
          >
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

        {result.errors.map((error) =>
          currentErrors.has(error) ? (
            <Typography key={error} variant="caption" sx={{ color: 'error.main', display: 'block' }}>
              - {error}
            </Typography>
          ) : (
            <Typography
              key={error}
              variant="caption"
              sx={{ color: 'success.main', display: 'block' }}
            >
              OK {error.split(':')[0].trim()}: corregido
            </Typography>
          )
        )}

        {editableFields.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Grid container columnSpacing={2} rowSpacing={1.5}>
              {editableFields.map((field) => (
                <Grid key={field.key} size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label={field.label}
                    value={result.normalized[field.key] ?? ''}
                    disabled={result.omitted}
                    onChange={(event) =>
                      onUpdate(index, { ...result.normalized, [field.key]: event.target.value })
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
