import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  FormHelperText,
  OutlinedInput,
} from '@mui/material';
import DataObjectIcon from '@mui/icons-material/DataObject';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { JsonPreviewModal } from '../ui/JsonPreviewModal';
import { useWizardContext } from '../../context/WizardContext';
import { useLeadersCatalog } from '../../hooks/useLeadersCatalog';
import { useFinalJsonBuilder } from '../../hooks/useFinalJsonBuilder';
import { normalize } from '../../utils/normalize';
import type { LeaderAssignment } from '../../utils/types';

const ROLE_ERROR_PREFIX = 'Rol lider';
const PERSON_ERROR_PREFIX = 'Persona lider';
const EMPTY_OPTION_LABEL = '--- Selecciona ---';

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

export function Step5Panel() {
  const { state, dispatch } = useWizardContext();
  const { step3, step4, step5 } = state;
  const leadersCatalog = useLeadersCatalog();
  const { buildJson, copyToClipboard, copied } = useFinalJsonBuilder();
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [json, setJson] = useState('');

  useEffect(() => {
    const built = leadersCatalog.build(step3.catalog, step4.catalog, step5.assignments);
    dispatch({ type: 'S5_SET_ASSIGNMENTS', payload: built });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step3.catalog, step4.catalog]);

  function handleLeaderChange(teamId: string, changes: Partial<LeaderAssignment>) {
    const updated = leadersCatalog.update(step5.assignments, teamId, changes);
    dispatch({ type: 'S5_SET_ASSIGNMENTS', payload: updated });
  }

  function handleGenerateJson() {
    const nextJson = buildJson();
    setJson(nextJson);
    setJsonModalOpen(true);
  }

  const summary = leadersCatalog.summary(step5.assignments);
  const ownTeamsCount = step3.catalog.filter((team) => team.leadershipMode === 'own').length;

  return (
    <Box>
      <StepHeader
        step={5}
        title="Asignación de líderes"
        subtitle="Para cada equipo con liderazgo propio, seleccioná el rol y definí si lideran una o varias personas, o todo el rol."
      />

      {ownTeamsCount === 0 && (
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
            No hay equipos con liderazgo propio configurados en el Paso 3.
          </Typography>
        </Box>
      )}

      {step5.assignments.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <ValidationSummaryBanner
            total={summary.total}
            valid={summary.valid}
            invalid={summary.invalid}
            hasErrors={summary.hasErrors}
            label="equipos"
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {step5.assignments.map((assignment) => {
              const uniqueRoles = [
                ...new Set(assignment.candidates.map((candidate) => candidate.role).filter(Boolean)),
              ].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

              const personsForRole = assignment.leaderRole
                ? assignment.candidates
                    .filter((candidate) => normalize(candidate.role) === normalize(assignment.leaderRole))
                    .map((candidate) => candidate.member)
                    .filter(
                      (member, index, arr) =>
                        arr.findIndex((value) => normalize(value) === normalize(member)) === index
                    )
                    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
                : [];

              const hasSingleCandidate = personsForRole.length === 1;
              const isAllMode = assignment.leaderSelectionMode === 'all';
              const roleError = assignment.errors.some((error) => error.includes(ROLE_ERROR_PREFIX));
              const personError = assignment.errors.some((error) => error.includes(PERSON_ERROR_PREFIX));

              return (
                <SectionCard key={assignment.teamId} sx={{ mb: 0 }}>
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: '#FAFAFA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>
                      {assignment.teamName}
                    </Typography>
                    {assignment.valid ? (
                      <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    ) : (
                      <Chip
                        label={`${assignment.errors.length} error${assignment.errors.length > 1 ? 'es' : ''}`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '11px',
                          fontWeight: 700,
                          bgcolor: 'error.main',
                          color: '#fff',
                          borderRadius: '999px',
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ p: 3 }}>
                    {assignment.candidates.length === 0 ? (
                      <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                        Este equipo no tiene asignaciones en el Paso 4.
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 220, flex: 1 }} error={roleError}>
                          <InputLabel>Rol lider *</InputLabel>
                          <Select
                            value={assignment.leaderRole}
                            label="Rol lider *"
                            onChange={(event) =>
                              handleLeaderChange(assignment.teamId, { leaderRole: event.target.value })
                            }
                            sx={{ borderRadius: '10px' }}
                          >
                            <MenuItem value="">{EMPTY_OPTION_LABEL}</MenuItem>
                            {uniqueRoles.map((role) => (
                              <MenuItem key={role} value={role}>{role}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl
                          size="small"
                          sx={{ minWidth: 220, flex: 1 }}
                          disabled={!assignment.leaderRole || hasSingleCandidate}
                        >
                          <InputLabel>Alcance del liderazgo</InputLabel>
                          <Select
                            value={assignment.leaderSelectionMode}
                            label="Alcance del liderazgo"
                            onChange={(event) =>
                              handleLeaderChange(assignment.teamId, {
                                leaderSelectionMode: event.target.value as LeaderAssignment['leaderSelectionMode'],
                              })
                            }
                            sx={{ borderRadius: '10px' }}
                          >
                            <MenuItem value="specific">Miembros específicos</MenuItem>
                            <MenuItem value="all">Todos los miembros del rol</MenuItem>
                          </Select>
                          {hasSingleCandidate && (
                            <FormHelperText>
                              Se autocompleta porque este rol tiene una sola persona asignada.
                            </FormHelperText>
                          )}
                        </FormControl>

                        <FormControl
                          size="small"
                          sx={{ minWidth: 260, flex: 1 }}
                          disabled={!assignment.leaderRole || isAllMode || hasSingleCandidate}
                          error={personError}
                        >
                          <InputLabel>Persona/s lider *</InputLabel>
                          <Select
                            multiple
                            value={assignment.leaderPersons}
                            input={<OutlinedInput label="Persona/s lider *" />}
                            renderValue={(selected) => {
                              const values = selected as string[];
                              return values.length > 0 ? values.join(', ') : EMPTY_OPTION_LABEL;
                            }}
                            onChange={(event) =>
                              handleLeaderChange(assignment.teamId, {
                                leaderPersons:
                                  typeof event.target.value === 'string'
                                    ? [event.target.value]
                                    : event.target.value,
                              })
                            }
                            sx={{ borderRadius: '10px' }}
                          >
                            {personsForRole.map((person) => (
                              <MenuItem key={person} value={person}>{person}</MenuItem>
                            ))}
                          </Select>
                          {isAllMode && (
                            <FormHelperText>
                              Se marcarán como lider todas las personas de este rol dentro del equipo.
                            </FormHelperText>
                          )}
                          {hasSingleCandidate && (
                            <FormHelperText>
                              Miembro autoseleccionado: {personsForRole[0]}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Box>
                    )}

                    {!assignment.valid && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        {assignment.errors.map((error) => (
                          <Typography key={error} sx={{ fontSize: '12px', color: 'error.main', display: 'block' }}>
                            • {error}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                </SectionCard>
              );
            })}
          </Box>
        </Box>
      )}

      <Box
        sx={{
          p: 3,
          borderRadius: '12px',
          bgcolor: 'primary.light',
          border: '1px solid',
          borderColor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '15px', color: 'primary.dark', mb: 0.25 }}>
            Estructura lista para exportar
          </Typography>
          <Typography sx={{ fontSize: '13px', color: 'primary.dark' }}>
            {step3.catalog.length} equipos · {step4.catalog.filter((a) => a.valid).length} asignaciones válidas
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<DataObjectIcon />}
          onClick={handleGenerateJson}
          disabled={summary.hasErrors && step5.assignments.length > 0}
          sx={{
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '14px',
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(124,58,237,0.25)',
            '&:hover': { boxShadow: '0 4px 16px rgba(124,58,237,0.35)' },
          }}
        >
          Generar JSON
        </Button>
      </Box>

      <JsonPreviewModal
        open={jsonModalOpen}
        onClose={() => setJsonModalOpen(false)}
        json={json}
        onCopy={copyToClipboard}
        copied={copied}
      />
    </Box>
  );
}
