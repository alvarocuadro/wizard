import { useCallback, useState } from 'react';
import {
  Box,
  Typography,
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
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { FileUploadZone } from '../ui/FileUploadZone';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { SheetSelector } from '../ui/SheetSelector';
import { useFileParser } from '../../hooks/useFileParser';
import { useColumnDetection } from '../../hooks/useColumnDetection';
import { useRowValidation } from '../../hooks/useRowValidation';
import { useWizardContext } from '../../context/WizardContext';
import { FIELDS, REQUIRED_FIELDS } from '../../utils/fields';
import { NONE_VALUE, WORK_MODE_VALUES } from '../../utils/constants';
import { validateFieldValue } from '../../utils/validators';
import { parseSheet } from '../../utils/workbookCache';
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
const DEFAULT_HELPER = 'Se aplicará a todas las filas mientras el campo siga sin mapear.';

// ─── Shared card wrapper ──────────────────────────────────────────────────────

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

// ─── Step header ─────────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export function Step1Panel() {
  const { state, dispatch } = useWizardContext();
  const { step1 } = state;
  const { parse, loading, error } = useFileParser();
  const { detectMappings } = useColumnDetection();
  const { validateAll, validateSingle, buildProcessedRows } = useRowValidation();

  const runValidation = useCallback(
    (rows: CellValue[][], headers: string[], mapping: FieldMapping, workModeMap: WorkModeValueMap, defaultValues: FieldDefaultValues) => {
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
        runValidation(result.rows, result.headers, mapping, step1.workModeValueMap, step1.defaultValues);
      } catch { /* error shown in FileUploadZone */ }
    },
    [parse, dispatch, detectMappings, runValidation, step1.workModeValueMap, step1.defaultValues]
  );

  function handleMappingChange(fieldKey: string, value: string) {
    const nextMapping: FieldMapping = { ...step1.mapping, [fieldKey]: value };
    dispatch({ type: 'S1_SET_MAPPING', payload: nextMapping });
    dispatch({ type: 'RESET_FROM_STEP', payload: 2 });
    if (step1.source?.rows.length) {
      runValidation(step1.source.rows, step1.source.headers, nextMapping, step1.workModeValueMap, step1.defaultValues);
    }
  }

  function handleDefaultValueChange(fieldKey: string, value: string) {
    const nextDefaults: FieldDefaultValues = { ...step1.defaultValues, [fieldKey]: value };
    dispatch({ type: 'S1_SET_DEFAULT_VALUES', payload: nextDefaults });
    dispatch({ type: 'RESET_FROM_STEP', payload: 2 });
    if (step1.source?.rows.length) {
      runValidation(step1.source.rows, step1.source.headers, step1.mapping, step1.workModeValueMap, nextDefaults);
    }
  }

  function handleWorkModeChange(key: keyof WorkModeValueMap, value: string) {
    const nextMap: WorkModeValueMap = { ...step1.workModeValueMap, [key]: value };
    dispatch({ type: 'S1_SET_WORKMODE_MAP', payload: nextMap });
    if (step1.source?.rows.length) {
      runValidation(step1.source.rows, step1.source.headers, step1.mapping, nextMap, step1.defaultValues);
    }
  }

  function handleRevalidate() {
    if (step1.validationResults.length === 0) return;
    const results = step1.validationResults.map((result) => {
      const errors = validateSingle(result.normalized);
      return { ...result, errors, valid: errors.length === 0 };
    });
    dispatch({ type: 'S1_SET_VALIDATION', payload: { results, processedRows: buildProcessedRows(results) } });
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

  // ── Empty state ──
  if (!step1.source || !step1.source.fileName) {
    return (
      <Box>
        <StepHeader
          step={1}
          title="Carga de miembros"
          subtitle="Subí el archivo con la información de los empleados (Excel o CSV)."
        />
        <FileUploadZone onFile={handleFile} loading={loading} error={error} />
      </Box>
    );
  }

  const { source, mapping, defaultValues, workModeValueMap, validationResults } = step1;

  const headerOptions = [
    { value: NONE_VALUE, label: NONE_LABEL },
    ...source.headers
      .filter(Boolean)
      .map((h) => ({ value: h, label: h }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })),
  ];

  const mappedRequired = REQUIRED_FIELDS.filter((f) => mapping[f.key] && mapping[f.key] !== NONE_VALUE).length;
  const allRequiredMapped = mappedRequired === REQUIRED_FIELDS.length;
  const workModeIsMapped = mapping.workMode && mapping.workMode !== NONE_VALUE;
  const unmappedFields = FIELDS.filter((f) => !f.required && (mapping[f.key] ?? NONE_VALUE) === NONE_VALUE);
  const usedColumns = new Set(Object.values(mapping).filter((v) => v && v !== NONE_VALUE));

  const wmColIndex = workModeIsMapped ? source.headers.indexOf(mapping.workMode) : -1;
  const uniqueWmValues =
    wmColIndex >= 0
      ? [...new Set(source.rows.map((row) => String(row[wmColIndex] ?? '').trim()).filter(Boolean))].sort((a, b) =>
          a.localeCompare(b, 'es', { sensitivity: 'base' })
        )
      : [];

  const previewFields = [
    ...REQUIRED_FIELDS,
    ...FIELDS.filter(
      (f) =>
        !f.required &&
        ((mapping[f.key] && mapping[f.key] !== NONE_VALUE) || (defaultValues[f.key] ?? '').trim())
    ),
  ].map((field) => {
    const mappedColumn = mapping[field.key];
    const defaultValue = defaultValues[field.key] ?? '';
    const colIdx = mappedColumn && mappedColumn !== NONE_VALUE ? source.headers.indexOf(mappedColumn) : -1;
    const values =
      colIdx >= 0
        ? [...new Set(source.rows.slice(0, 8).map((row) => String(row[colIdx] ?? '').trim()).filter(Boolean))]
        : defaultValue.trim()
        ? [defaultValue.trim()]
        : [];
    return { field, columnName: colIdx >= 0 ? mappedColumn : null, values, isDefault: colIdx < 0 && defaultValue.trim().length > 0 };
  });

  const validCount = validationResults.filter((r) => r.valid && !r.omitted).length;
  const invalidResults = validationResults.filter((r) => !r.valid);

  return (
    <Box>
      <StepHeader step={1} title="Carga de miembros" subtitle="Mapeá las columnas del archivo con los campos del sistema." />

      {/* File info card */}
      <SectionCard sx={{ mb: 3 }}>
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 22, flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
              {source.fileName}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
              {source.rows.length} filas · {source.headers.length} columnas
              {source.sheetNames.length > 1 && ` · ${source.sheetNames.length} hojas`}
            </Typography>
            <SheetSelector sheetNames={source.sheetNames} value={source.sheetName} onChange={handleSheetChange} />
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SwapHorizIcon sx={{ fontSize: '15px !important' }} />}
            onClick={handleChangeFile}
            sx={{
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'warning.main',
              color: 'warning.dark',
              '&:hover': { borderColor: 'warning.dark', bgcolor: 'warning.light' },
            }}
          >
            Cambiar archivo
          </Button>
        </Box>
      </SectionCard>

      {/* Field mapping */}
      <Accordion
        defaultExpanded
        elevation={0}
        sx={{
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px !important',
          '&:before': { display: 'none' },
          overflow: 'hidden',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ px: 3, py: 1.5, bgcolor: '#FAFAFA', '&.Mui-expanded': { minHeight: 0 } }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>
              Mapeo de campos
            </Typography>
            <Chip
              label={`${mappedRequired}/${REQUIRED_FIELDS.length} obligatorios`}
              size="small"
              sx={{
                height: 22,
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '999px',
                bgcolor: allRequiredMapped ? 'success.light' : 'warning.light',
                color: allRequiredMapped ? 'success.dark' : 'warning.dark',
              }}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {FIELDS.map((field) => {
              const current = mapping[field.key] ?? NONE_VALUE;
              const isMapped = current !== NONE_VALUE;
              return (
                <Grid key={field.key} size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>
                      {field.label}
                      {field.required && <Box component="span" sx={{ color: 'error.main' }}> *</Box>}
                    </InputLabel>
                    <Select
                      value={current}
                      label={`${field.label}${field.required ? ' *' : ''}`}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      sx={{
                        bgcolor: isMapped ? '#F0FDF4' : undefined,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: isMapped ? 'success.main' : undefined,
                        },
                      }}
                    >
                      {headerOptions.map((opt) => (
                        <MenuItem
                          key={opt.value}
                          value={opt.value}
                          disabled={opt.value !== NONE_VALUE && usedColumns.has(opt.value) && opt.value !== current}
                        >
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              );
            })}
          </Grid>

          {unmappedFields.length > 0 && (
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#374151', mb: 0.5 }}>
                Valores por defecto para campos sin mapear
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 2 }}>
                Solo para campos opcionales. Si una columna no existe en el archivo, completá ese campo una sola vez.
              </Typography>
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
                      <Box
                        sx={{
                          border: '1px solid',
                          borderRadius: '10px',
                          p: 2,
                          borderColor: defaultValue.trim() && !hasError ? 'success.main' : 'divider',
                          bgcolor: defaultValue.trim() && !hasError ? '#F0FDF4' : 'background.paper',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#374151' }}>
                            {field.label}
                          </Typography>
                          <Chip
                            size="small"
                            label={field.required ? 'Obligatorio' : 'Opcional'}
                            sx={{
                              height: 20,
                              fontSize: '10px',
                              fontWeight: 700,
                              borderRadius: '999px',
                              bgcolor: field.required ? 'warning.light' : '#F3F4F6',
                              color: field.required ? 'warning.dark' : '#6B7280',
                            }}
                          />
                        </Box>
                        {field.type === 'enum' ? (
                          <FormControl fullWidth size="small" error={hasError}>
                            <InputLabel>Valor por defecto</InputLabel>
                            <Select value={defaultValue} label="Valor por defecto" onChange={(e) => handleDefaultValueChange(field.key, e.target.value)}>
                              <MenuItem value="">{EMPTY_DEFAULT_LABEL}</MenuItem>
                              {WORK_MODE_VALUES.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                            </Select>
                          </FormControl>
                        ) : (
                          <TextField
                            size="small"
                            fullWidth
                            label="Valor por defecto"
                            placeholder={field.type === 'date' ? 'DD/MM/AAAA' : ''}
                            value={defaultValue}
                            onChange={(e) => handleDefaultValueChange(field.key, e.target.value)}
                            error={hasError}
                          />
                        )}
                        <Typography sx={{ fontSize: '11px', mt: 1, color: hasError ? 'error.main' : '#6B7280' }}>
                          {hasError ? defaultErrors[0] : DEFAULT_HELPER}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {workModeIsMapped && (
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#374151', mb: 0.5 }}>
                Valores de modalidad en el archivo
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 2 }}>
                {uniqueWmValues.length > 0
                  ? 'Indicá a qué modalidad canónica corresponde cada valor encontrado.'
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
                          onChange={(e) => handleWorkModeChange(mode as keyof WorkModeValueMap, e.target.value)}
                        >
                          <MenuItem value="">{EMPTY_DEFAULT_LABEL}</MenuItem>
                          {uniqueWmValues.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
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

      {/* Preview */}
      <SectionCard>
        <SectionHeader>Vista previa del mapeo</SectionHeader>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {previewFields.map(({ field, columnName, values, isDefault }) => (
            <Box key={field.key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#374151' }}>
                  {field.label}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                  {columnName ?? (isDefault ? 'Valor por defecto' : 'Sin asignar')}
                </Typography>
              </Box>
              {values.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {values.map((v, i) => (
                    <Chip
                      key={i}
                      label={v}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '11px', borderRadius: '999px', borderColor: 'divider' }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>
                  Todavía no hay una columna elegida.
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </SectionCard>

      {/* Revalidate */}
      <Box sx={{ mb: 2.5, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon sx={{ fontSize: '16px !important' }} />}
          onClick={handleRevalidate}
          size="small"
          sx={{
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'none',
            borderColor: 'divider',
            color: '#374151',
            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
          }}
        >
          Re-validar datos
        </Button>
        {validationResults.length > 0 && (
          <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
            {validCount} filas válidas de {validationResults.length}
          </Typography>
        )}
      </Box>

      {/* Validation */}
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
            <Accordion
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'warning.main',
                borderRadius: '12px !important',
                '&:before': { display: 'none' },
                overflow: 'hidden',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 3, py: 1.5, bgcolor: 'warning.light' }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: '14px', color: 'warning.dark' }}>
                  {invalidResults.length} filas con errores (no se exportarán)
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2 }}>
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

// ─── Invalid rows list ────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

interface InvalidRowsListProps {
  invalidResults: ValidationResult[];
  validationResults: ValidationResult[];
  validateSingle: (normalized: NormalizedRow) => string[];
  onUpdate: (index: number, normalized: Record<string, string>) => void;
  onToggleOmit: (index: number) => void;
}

function InvalidRowsList({ invalidResults, validationResults, validateSingle, onUpdate, onToggleOmit }: InvalidRowsListProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(invalidResults.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const start = (safePage - 1) * PAGE_SIZE;
  const pageResults = invalidResults.slice(start, start + PAGE_SIZE);

  return (
    <>
      <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1.5 }}>
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
          <Pagination count={totalPages} page={safePage} onChange={(_, v) => setPage(v)} color="primary" size="small" />
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

function InvalidRowCard({ result, index, validateSingle, onUpdate, onToggleOmit }: InvalidRowCardProps) {
  const errorFieldLabels = new Set(result.errors.map((e) => e.split(':')[0].trim()));
  const editableFields = FIELDS.filter((f) => errorFieldLabels.has(f.label));
  const currentErrors = new Set(validateSingle(result.normalized));
  const allResolved = result.errors.length > 0 && result.errors.every((e) => !currentErrors.has(e));

  return (
    <Box
      sx={{
        mb: 1.5,
        borderRadius: '10px',
        border: '1px solid',
        borderColor: result.omitted ? 'divider' : allResolved ? 'success.main' : 'warning.main',
        bgcolor: result.omitted ? '#FAFAFA' : allResolved ? '#F0FDF4' : 'background.paper',
        opacity: result.omitted ? 0.65 : 1,
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: allResolved ? 'success.dark' : 'warning.dark' }}>
          Fila {result.rowNumber}
        </Typography>
        <Button
          size="small"
          variant="text"
          onClick={() => onToggleOmit(index)}
          sx={{
            py: 0, minHeight: 0,
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'none',
            color: result.omitted ? 'primary.main' : 'warning.dark',
          }}
        >
          {result.omitted ? 'Incluir' : 'Omitir fila'}
        </Button>
      </Box>

      {result.errors.map((err) =>
        currentErrors.has(err) ? (
          <Typography key={err} sx={{ fontSize: '12px', color: 'error.main', display: 'block' }}>
            • {err}
          </Typography>
        ) : (
          <Typography key={err} sx={{ fontSize: '12px', color: 'success.main', display: 'block' }}>
            ✓ {err.split(':')[0].trim()}: corregido
          </Typography>
        )
      )}

      {editableFields.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Grid container spacing={1}>
            {editableFields.map((field) => (
              <Grid key={field.key} size={{ xs: 12, sm: 6 }}>
                <TextField
                  size="small"
                  fullWidth
                  label={field.label}
                  value={result.normalized[field.key] ?? ''}
                  disabled={result.omitted}
                  onChange={(e) => onUpdate(index, { ...result.normalized, [field.key]: e.target.value })}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
