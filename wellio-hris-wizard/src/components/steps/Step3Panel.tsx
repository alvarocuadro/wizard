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
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  Alert,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import ParkIcon from '@mui/icons-material/Park';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { SourceFileChoice } from './SourceFileChoice';
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
    const col = detectTeamColumn(effectiveSource.headers);
    dispatch({ type: 'S3_SET_COLUMN', payload: col });
    if (col !== NONE_VALUE) {
      const catalog = teamsCatalog.build(effectiveSource.rows, effectiveSource.headers, col, []);
      dispatch({ type: 'S3_SET_CATALOG', payload: catalog });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSameFile() {
    dispatch({ type: 'S3_SET_SOURCE_DATA', payload: { mode: 'same', fileName: '', headers: [], rows: [] } });
    dispatch({ type: 'S3_SET_COLUMN', payload: NONE_VALUE });
    dispatch({ type: 'S3_SET_CATALOG', payload: [] });
    dispatch({ type: 'RESET_FROM_STEP', payload: 4 });
    initialDetectDone.current = false;
  }

  function handleOtherFile(result: FileParseResult) {
    if (!result.headers.length) return;
    dispatch({ type: 'S3_SET_SOURCE_DATA', payload: { mode: 'other', ...result } });
    const col = detectTeamColumn(result.headers);
    dispatch({ type: 'S3_SET_COLUMN', payload: col });
    if (col !== NONE_VALUE) {
      const catalog = teamsCatalog.build(result.rows, result.headers, col, []);
      dispatch({ type: 'S3_SET_CATALOG', payload: catalog });
    } else {
      dispatch({ type: 'S3_SET_CATALOG', payload: [] });
    }
    dispatch({ type: 'RESET_FROM_STEP', payload: 4 });
  }

  function handleColumnChange(col: string) {
    dispatch({ type: 'S3_SET_COLUMN', payload: col });
    if (!effectiveSource) return;
    if (col !== NONE_VALUE) {
      const catalog = teamsCatalog.build(
        effectiveSource.rows,
        effectiveSource.headers,
        col,
        step3.catalog
      );
      dispatch({ type: 'S3_SET_CATALOG', payload: catalog });
    } else {
      dispatch({ type: 'S3_SET_CATALOG', payload: [] });
    }
    dispatch({ type: 'RESET_FROM_STEP', payload: 4 });
  }

  function handleTeamChange(id: string, changes: Partial<TeamCatalogItem>) {
    let updated = step3.catalog.map((t) => (t.id === id ? { ...t, ...changes } : t));
    if (changes.isMain === true) {
      updated = updated.map((t) => (t.id === id ? t : { ...t, isMain: false }));
    }
    const revalidated = teamsCatalog.revalidate(updated);
    dispatch({ type: 'S3_SET_CATALOG', payload: revalidated });
    dispatch({ type: 'RESET_FROM_STEP', payload: 4 });
  }

  const summary = teamsCatalog.summary(step3.catalog);
  const treeLines = teamsCatalog.getTreeLines(step3.catalog);
  const mainTeamId = step3.catalog.find((t) => t.isMain)?.id ?? '';

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
        Paso 3: Catálogo de equipos
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Seleccioná la columna de equipos y configurá la jerarquía.
      </Typography>

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

      {effectiveSource && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Columna de equipos *</InputLabel>
            <Select
              value={step3.selectedColumn}
              label="Columna de equipos *"
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

      {summary.hasLoop && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          Se detectó una dependencia circular en la jerarquía. Revisá los equipos padre asignados.
        </Alert>
      )}

      {step3.catalog.length > 0 && (
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Catalog */}
          <Box sx={{ flex: '1 1 400px' }}>
            <ValidationSummaryBanner
              total={summary.total}
              valid={summary.valid}
              invalid={summary.invalid}
              hasErrors={summary.hasErrors}
              label="equipos"
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
              Radio = equipo principal · Liderazgo = propio o heredado · Padre = equipos padre
            </Typography>

            <RadioGroup
              value={mainTeamId}
              onChange={(e) => handleTeamChange(e.target.value, { isMain: true })}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {step3.catalog.map((team) => {
                  const otherTeams = step3.catalog.filter((t) => t.id !== team.id);
                  return (
                    <Card
                      key={team.id}
                      variant="outlined"
                      sx={{ borderRadius: 2, borderColor: team.valid ? 'divider' : 'error.light' }}
                    >
                      <CardContent sx={{ py: '8px !important', px: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <FormControlLabel
                            value={team.id}
                            control={<Radio size="small" />}
                            label=""
                            sx={{ m: 0, mr: -1 }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: 1,
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {team.name}
                                {team.isMain && (
                                  <Chip label="Principal" size="small" color="primary" sx={{ ml: 1 }} />
                                )}
                              </Typography>

                              <FormControl size="small" sx={{ minWidth: 130 }}>
                                <InputLabel>Liderazgo</InputLabel>
                                <Select
                                  value={team.leadershipMode}
                                  label="Liderazgo"
                                  onChange={(e) =>
                                    handleTeamChange(team.id, {
                                      leadershipMode: e.target.value as 'own' | 'inherit',
                                    })
                                  }
                                >
                                  <MenuItem value="own">Propio</MenuItem>
                                  <MenuItem value="inherit">Heredado</MenuItem>
                                </Select>
                              </FormControl>
                            </Box>

                            {!team.isMain && otherTeams.length > 0 && (
                              <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                                <InputLabel>Equipos padre</InputLabel>
                                <Select
                                  multiple
                                  value={team.parentIds}
                                  onChange={(e) =>
                                    handleTeamChange(team.id, {
                                      parentIds: e.target.value as string[],
                                    })
                                  }
                                  input={<OutlinedInput label="Equipos padre" />}
                                  renderValue={(selected) =>
                                    selected
                                      .map((id) => step3.catalog.find((t) => t.id === id)?.name ?? id)
                                      .join(', ')
                                  }
                                >
                                  {otherTeams.map((t) => (
                                    <MenuItem key={t.id} value={t.id}>
                                      <Checkbox checked={team.parentIds.includes(t.id)} size="small" />
                                      <ListItemText primary={t.name} />
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}

                            {!team.valid && (
                              <Box sx={{ mt: 0.5 }}>
                                {team.errors.map((e) => (
                                  <Typography
                                    key={e}
                                    variant="caption"
                                    sx={{ color: 'error.main', display: 'block' }}
                                  >
                                    • {e}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </RadioGroup>
          </Box>

          {/* Tree preview */}
          {treeLines.length > 0 && (
            <Box sx={{ flex: '0 0 240px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ParkIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Vista de árbol
                </Typography>
              </Box>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflowX: 'auto',
                  whiteSpace: 'pre',
                }}
              >
                {treeLines.join('\n')}
              </Box>
            </Box>
          )}
        </Box>
      )}

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
    </Box>
  );
}
