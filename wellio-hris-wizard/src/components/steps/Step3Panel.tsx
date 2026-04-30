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
  FormControlLabel,
  Chip,
  Alert,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Switch,
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
  const treeLines = teamsCatalog.getTreeLines(step3.catalog);

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
        Paso 3: Catalogo de equipos
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Selecciona la columna de equipos y configura la jerarquia.
      </Typography>

      <Card variant="outlined" sx={{ mb: 4, borderRadius: 4 }}>
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
        <Box sx={{ mb: 4 }}>
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

      {summary.hasLoop && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          Se detecto una dependencia circular en la jerarquia. Revisa los equipos padre asignados.
        </Alert>
      )}

      {step3.catalog.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 300px' },
            gap: 4,
            alignItems: 'start',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <ValidationSummaryBanner
              total={summary.total}
              valid={summary.valid}
              invalid={summary.invalid}
              hasErrors={summary.hasErrors}
              label="equipos"
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
              Switch = equipo principal · Liderazgo = propio o heredado · Padre = equipos padre
            </Typography>

            <Box
              sx={{
                maxHeight: { xs: 'none', lg: '68vh' },
                overflowY: { xs: 'visible', lg: 'auto' },
                pr: { xs: 0, lg: 1 },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {step3.catalog.map((team) => {
                  const otherTeams = step3.catalog.filter((item) => item.id !== team.id);

                  return (
                    <Card
                      key={team.id}
                      variant="outlined"
                      sx={{ borderRadius: 2, borderColor: team.valid ? 'divider' : 'error.light' }}
                    >
                      <CardContent sx={{ py: '12px !important', px: 2.5 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 1.5,
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 240 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {team.name}
                                {team.isMain && (
                                  <Chip
                                    label="Principal"
                                    size="small"
                                    color="primary"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Typography>
                              <FormControlLabel
                                sx={{ mt: 0.5, ml: 0 }}
                                control={
                                  <Switch
                                    size="small"
                                    checked={team.isMain}
                                    onChange={(event) =>
                                      handleTeamChange(team.id, { isMain: event.target.checked })
                                    }
                                  />
                                }
                                label="Es equipo principal"
                              />
                            </Box>

                            <FormControl size="small" sx={{ minWidth: 160 }}>
                              <InputLabel>Liderazgo</InputLabel>
                              <Select
                                value={team.leadershipMode}
                                label="Liderazgo"
                                onChange={(event) =>
                                  handleTeamChange(team.id, {
                                    leadershipMode: event.target.value as 'own' | 'inherit',
                                  })
                                }
                              >
                                <MenuItem value="own">Propio</MenuItem>
                                <MenuItem value="inherit">Heredado</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>

                          {!team.isMain && otherTeams.length > 0 && (
                            <FormControl fullWidth size="small">
                              <InputLabel>Equipos padre</InputLabel>
                              <Select
                                multiple
                                value={team.parentIds}
                                onChange={(event) =>
                                  handleTeamChange(team.id, {
                                    parentIds: event.target.value as string[],
                                  })
                                }
                                input={<OutlinedInput label="Equipos padre" />}
                                renderValue={(selected) =>
                                  selected
                                    .map((id) => step3.catalog.find((item) => item.id === id)?.name ?? id)
                                    .join(', ')
                                }
                              >
                                {otherTeams.map((item) => (
                                  <MenuItem key={item.id} value={item.id}>
                                    <Checkbox checked={team.parentIds.includes(item.id)} size="small" />
                                    <ListItemText primary={item.name} />
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}

                          {!team.valid && (
                            <Box>
                              {team.errors.map((error) => (
                                <Typography
                                  key={error}
                                  variant="caption"
                                  sx={{ color: 'error.main', display: 'block' }}
                                >
                                  - {error}
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          </Box>

          {treeLines.length > 0 && (
            <Box
              sx={{
                width: '100%',
                position: { xs: 'static', lg: 'sticky' },
                top: { xs: 'auto', lg: 24 },
              }}
            >
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ParkIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Vista de arbol
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
                      maxHeight: { xs: 'none', lg: '60vh' },
                      whiteSpace: 'pre',
                    }}
                  >
                    {treeLines.join('\n')}
                  </Box>
                </CardContent>
              </Card>
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
            Selecciona una columna para ver el catalogo de equipos
          </Typography>
        </Box>
      )}
    </Box>
  );
}
