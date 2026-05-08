import { useCallback, useState } from 'react';
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
  Pagination,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import { FileUploadZone } from '../ui/FileUploadZone';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { SheetSelector } from '../ui/SheetSelector';
import { useFileParser } from '../../hooks/useFileParser';
import { parseSheet } from '../../utils/workbookCache';
import { useColumnDetection } from '../../hooks/useColumnDetection';
import { useRowValidation } from '../../hooks/useRowValidation';
import { useWizardContext } from '../../context/WizardContext';
import { FIELDS, REQUIRED_FIELDS } from '../../utils/fields';
import { NONE_VALUE, WORK_MODE_VALUES } from '../../utils/constants';
import { validateFieldValue } from '../../utils/validators';
import type {
  CellValue,
  FieldMapping,
  FieldDefaultValues,
  NormalizedRow,
  ValidationResult,
  WorkModeValueMap,
} from '../../utils/types';

const NONE_LABEL = '--- No mapear ---';
const EMPTY_DEFAULT_LABEL = '--- Sin valor ---';
const DEFAULT_HELPER = 'Se aplicara a todas las filas mientras el campo siga sin mapear.';

export function Step1Panel() {
  const { state, dispatch } = useWizardContext();
  const { step1 } = state;
  const { parse, loading, error } = useFileParser();
  const { detectMappings } = useColumnDetection();
  const { validateAll, validateSingle, buildProcessedRows } = useRowValidation();

  const runValidation = useCallback(
    (
      rows: CellValue[][],
      headers: string[],
      mapping: FieldMapping,
      workModeMap: WorkModeValueMap,
      defaultValues: FieldDefaultValues
    ) => {
      const results = validateAll(rows, mapping, headers, workModeMap, defaultValues);
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
        runValidation(
          result.rows,
          result.headers,
          mapping,
          step1.workModeValueMap,
          step1.defaultValues
        );
      } catch {
        // Error displayed by FileUploadZone
      }
    },
    [parse, dispatch, detectMappings, runValidation, step1.workModeValueMap, step1.defaultValues]
  );

  function handleMappingChange(fieldKey: string, value: string) {
    const nextMapping: FieldMapping = { ...step1.mapping, [fieldKey]: value };
    dispatch({ type: 'S1_SET_MAPPING', payload: nextMapping });
    dispatch({ type: 'RESET_FROM_STEP', payload: 2 });

    if (step1.source?.rows.length) {
      runValidation(
        step1.source.rows,
        step1.source.headers,
        nextMapping,
        step1.workModeValueMap,
        step1.defaultValues
      );
    }
  }

  function handleDefaultValueChange(fieldKey: string, value: string) {
    const nextDefaults: FieldDefaultValues = { ...step1.defaultValues, [fieldKey]: value };
    dispatch({ type: 'S1_SET_DEFAULT_VALUES', payload: nextDefaults });
    dispatch({ type: 'RESET_FROM_STEP', payload: 2 });

    if (step1.source?.rows.length) {
      runValidation(
        step1.source.rows,
        step1.source.headers,
        step1.mapping,
        step1.workModeValueMap,
        nextDefaults
      );
    }
  }

  function handleWorkModeChange(key: keyof WorkModeValueMap, value: string) {
    const nextMap: WorkModeValueMap = { ...step1.workModeValueMap, [key]: value };
    dispatch({ type: 'S1_SET_WORKMODE_MAP', payload: nextMap });

    if (step1.source?.rows.length) {
      runValidation(
        step1.source.rows,
        step1.source.headers,
        step1.mapping,
        nextMap,
        step1.defaultValues
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
    dispatch({ type: 'S1_SET_SOURCE', payload: { fileName: '', sheetName: '', sheetNames: [], headers: [], rows: [] } });
    dispatch({ type: 'S1_RESET_VALIDATION' });
    dispatch({ type: 'RESET_FROM_STEP', payload: 2 });
  }

  function handleSheetChange(sheetName: string) {
    if (!step1.source) return;
    const sheetData = parseSheet(step1.source.fileName, sheetName);
    if (!sheetData) return;
    const newSource = { ...step1.source, sheetName, headers: sheetData.headers, rows: sheetData.rows };
    dispatch({ type: 'S1_SET_SOURCE', payload: newSource });
    dispatch({ type: 'RESET_FROM_STEP', payload: 2 });
    const mapping = detectMappings(sheetData.headers);
    dispatch({ type: 'S1_SET_MAPPING', payload: mapping });
    runValidation(sheetData.rows, sheetData.headers, mapping, step1.workModeValueMap, step1.defaultValues);
  }

  if (!step1.source || !step1.source.fileName) {
    return (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Paso 1: Carga de miembros
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Subi el archivo con la informacion de los empleados (Excel o CSV).
        </Typography>
        <FileUploadZone onFile={handleFile} loading={loading} error={error} />
      </Box>
    );
  }

  const { source, mapping, defaultValues, workModeValueMap, validationResults } = step1;

  const headerOptions = [
    { value: NONE_VALUE, label: NONE_LABEL },
    ...source.headers
      .filter(Boolean)
      .map((header) => ({ value: header, label: header }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })),
  ];

  const mappedRequired = REQUIRED_FIELDS.filter(
    (field) => mapping[field.key] && mapping[field.key] !== NONE_VALUE
  ).length;
  const allRequiredMapped = mappedRequired === REQUIRED_FIELDS.length;
  const workModeIsMapped = mapping.workMode && mapping.workMode !== NONE_VALUE;
  const unmappedFields = FIELDS.filter(
    (field) => !field.required && (mapping[field.key] ?? NONE_VALUE) === NONE_VALUE
  );

  const usedColumns = new Set(Object.values(mapping).filter((value) => value && value !== NONE_VALUE));

  const wmColIndex = workModeIsMapped ? source.headers.indexOf(mapping.workMode) : -1;
  const uniqueWmValues =
    wmColIndex >= 0
      ? [
          ...new Set(
            source.rows
              .map((row) => String(row[wmColIndex] ?? '').trim())
              .filter(Boolean)
          ),
        ].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
      : [];

  const previewFields = [
    ...REQUIRED_FIELDS,
    ...FIELDS.filter(
      (field) =>
        !field.required &&
        ((mapping[field.key] && mapping[field.key] !== NONE_VALUE) ||
          (defaultValues[field.key] ?? '').trim())
    ),
  ].map((field) => {
    const mappedColumn = mapping[field.key];
    const defaultValue = defaultValues[field.key] ?? '';
    const columnIndex =
      mappedColumn && mappedColumn !== NONE_VALUE ? source.headers.indexOf(mappedColumn) : -1;

    const values =
      columnIndex >= 0
        ? [
            ...new Set(
              source.rows
                .slice(0, 8)
                .map((row) => String(row[columnIndex] ?? '').trim())
                .filter(Boolean)
            ),
          ]
        : defaultValue.trim()
          ? [defaultValue.trim()]
          : [];

    return {
      field,
      columnName: columnIndex >= 0 ? mappedColumn : null,
      values,
      isDefault: columnIndex < 0 && defaultValue.trim().length > 0,
    };
  });

  const validCount = validationResults.filter((result) => result.valid && !result.omitted).length;
  const invalidResults = validationResults.filter((result) => !result.valid);

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent
          sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important', px: 2, flexWrap: 'wrap' }}
        >
          <CheckCircleIcon color="success" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {source.fileName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {source.rows.length} filas · {source.headers.length} columnas detectadas
              {source.sheetNames.length > 1 && ` · ${source.sheetNames.length} hojas`}
            </Typography>
            <SheetSelector
              sheetNames={source.sheetNames}
              value={source.sheetName}
              onChange={handleSheetChange}
            />
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={handleChangeFile}
            sx={{
              color: 'warning.main',
              borderColor: 'warning.main',
              '&:hover': {
                borderColor: 'warning.dark',
                color: 'warning.dark',
                backgroundColor: 'warning.lighter',
              },
            }}
          >
            Cambiar archivo
          </Button>
        </CardContent>
      </Card>

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
                        <Box component="span" sx={{ color: 'error.main' }}>
                          {' '}
                          *
                        </Box>
                      )}
                    </InputLabel>
                    <Select
                      value={current}
                      label={`${field.label}${field.required ? ' *' : ''}`}
                      onChange={(event) => handleMappingChange(field.key, event.target.value)}
                      sx={{ bgcolor: isMapped ? 'success.light' : undefined }}
                    >
                      {headerOptions.map((option) => (
                        <MenuItem
                          key={option.value}
                          value={option.value}
                          disabled={
                            option.value !== NONE_VALUE &&
                            usedColumns.has(option.value) &&
                            option.value !== current
                          }
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              );
            })}
          </Grid>

          {unmappedFields.length > 0 && (
            <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Valores por defecto para campos sin mapear
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Solo para campos opcionales. Si una columna no existe en el archivo, podes completar ese campo una sola vez y se aplicara a todos los miembros.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {unmappedFields.map((field) => {
                  const defaultValue = defaultValues[field.key] ?? '';
                  const defaultErrors = validateFieldValue(defaultValue, {
                    required: field.required,
                    type: field.type,
                    maxLength: field.maxLength,
                    isNameField: field.key === 'firstName' || field.key === 'lastName',
                  });
                  const hasError = defaultValue.trim().length > 0 && defaultErrors.length > 0;

                  return (
                    <Grid key={`default-${field.key}`} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          height: '100%',
                          borderColor:
                            defaultValue.trim().length > 0 && defaultErrors.length === 0
                              ? 'success.light'
                              : undefined,
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1,
                              mb: 1.5,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {field.label}
                            </Typography>
                            <Chip
                              size="small"
                              label={field.required ? 'Obligatorio' : 'Opcional'}
                              color={field.required ? 'warning' : 'default'}
                              variant={field.required ? 'filled' : 'outlined'}
                            />
                          </Box>

                          {field.type === 'enum' ? (
                            <FormControl fullWidth size="small" error={hasError}>
                              <InputLabel>Valor por defecto</InputLabel>
                              <Select
                                value={defaultValue}
                                label="Valor por defecto"
                                onChange={(event) =>
                                  handleDefaultValueChange(field.key, event.target.value)
                                }
                              >
                                <MenuItem value="">{EMPTY_DEFAULT_LABEL}</MenuItem>
                                {WORK_MODE_VALUES.map((value) => (
                                  <MenuItem key={value} value={value}>
                                    {value}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <TextField
                              size="small"
                              fullWidth
                              label="Valor por defecto"
                              placeholder={field.type === 'date' ? 'DD/MM/AAAA' : ''}
                              value={defaultValue}
                              onChange={(event) =>
                                handleDefaultValueChange(field.key, event.target.value)
                              }
                              error={hasError}
                            />
                          )}

                          <Typography
                            variant="caption"
                            sx={{
                              mt: 1,
                              minHeight: 32,
                              display: 'block',
                              color: hasError ? 'error.main' : 'text.secondary',
                            }}
                          >
                            {hasError ? defaultErrors[0] : DEFAULT_HELPER}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {workModeIsMapped && (
            <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Valores de modalidad en el archivo
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', display: 'block', mb: 2 }}
              >
                {uniqueWmValues.length > 0
                  ? 'Indica a que modalidad canonica corresponde cada valor encontrado.'
                  : 'No se encontraron valores en la columna seleccionada.'}
              </Typography>
              {uniqueWmValues.length > 0 && (
                <Grid container spacing={2}>
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
              )}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      <Card variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            Vista previa
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Primeras filas del archivo para validar rapido si el mapeo propuesto es correcto.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {previewFields.map(({ field, columnName, values, isDefault }) => (
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
                    {columnName ?? (isDefault ? 'Valor por defecto' : 'Sin asignar')}
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
                    Todavia no hay una columna elegida.
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

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
            <Accordion sx={{ borderRadius: '12px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 600, color: 'warning.dark' }}>
                  {invalidResults.length} filas con errores (no se exportaran)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <InvalidRowsList
                  invalidResults={invalidResults}
                  validationResults={validationResults}
                  validateSingle={validateSingle}
                  onUpdate={(targetIndex, normalized) =>
                    dispatch({ type: 'S1_UPDATE_ROW', payload: { index: targetIndex, normalized } })
                  }
                  onToggleOmit={(targetIndex) =>
                    dispatch({ type: 'S1_TOGGLE_OMIT', payload: targetIndex })
                  }
                />
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Box>
  );
}

const PAGE_SIZE = 10;

interface InvalidRowsListProps {
  invalidResults: ValidationResult[];
  validationResults: ValidationResult[];
  validateSingle: (normalized: NormalizedRow) => string[];
  onUpdate: (index: number, normalized: Record<string, string>) => void;
  onToggleOmit: (index: number) => void;
}

function InvalidRowsList({
  invalidResults,
  validationResults,
  validateSingle,
  onUpdate,
  onToggleOmit,
}: InvalidRowsListProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(invalidResults.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const start = (safePage - 1) * PAGE_SIZE;
  const pageResults = invalidResults.slice(start, start + PAGE_SIZE);

  return (
    <>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
        Mostrando {start + 1}–{Math.min(start + PAGE_SIZE, invalidResults.length)} de {invalidResults.length} filas con errores
      </Typography>
      {pageResults.map((result) => {
        const index = validationResults.indexOf(result);
        return (
          <InvalidRowCard
            key={result.rowNumber}
            result={result}
            index={index}
            validateSingle={validateSingle}
            onUpdate={onUpdate}
            onToggleOmit={onToggleOmit}
          />
        );
      })}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={safePage}
            onChange={(_, value) => setPage(value)}
            color="primary"
            size="small"
          />
        </Box>
      )}
    </>
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
        borderRadius: 2,
        borderColor: result.omitted ? 'divider' : allResolved ? 'success.light' : 'warning.light',
        opacity: result.omitted ? 0.6 : 1,
      }}
    >
      <CardContent sx={{ py: '10px !important', px: 2 }}>
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
            <Grid container spacing={1}>
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
