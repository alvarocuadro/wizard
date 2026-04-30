import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
} from '@mui/material';
import DataObjectIcon from '@mui/icons-material/DataObject';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { JsonPreviewModal } from '../ui/JsonPreviewModal';
import { useWizardContext } from '../../context/WizardContext';
import { useLeadersCatalog } from '../../hooks/useLeadersCatalog';
import { useFinalJsonBuilder } from '../../hooks/useFinalJsonBuilder';
import { normalize } from '../../utils/normalize';
import type { LeaderAssignment } from '../../utils/types';

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
    const j = buildJson();
    setJson(j);
    setJsonModalOpen(true);
  }

  const summary = leadersCatalog.summary(step5.assignments);
  const ownTeamsCount = step3.catalog.filter((t) => t.leadershipMode === 'own').length;

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        Paso 5: Asignación de líderes
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Para cada equipo con liderazgo propio, seleccioná el rol y la persona líder.
      </Typography>

      {ownTeamsCount === 0 && (
        <Box
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            mb: 3,
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No hay equipos con liderazgo propio configurados en el Paso 3.
          </Typography>
        </Box>
      )}

      {step5.assignments.length > 0 && (
        <Box>
          <ValidationSummaryBanner
            total={summary.total}
            valid={summary.valid}
            invalid={summary.invalid}
            hasErrors={summary.hasErrors}
            label="equipos"
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            {step5.assignments.map((assignment) => {
              const uniqueRoles = [
                ...new Set(assignment.candidates.map((c) => c.role).filter(Boolean)),
              ].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

              const personsForRole = assignment.leaderRole
                ? assignment.candidates
                    .filter((c) => normalize(c.role) === normalize(assignment.leaderRole))
                    .map((c) => c.member)
                    .filter((m, i, arr) => arr.indexOf(m) === i)
                    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
                : [];

              return (
                <Card
                  key={assignment.teamId}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: assignment.valid ? 'divider' : 'error.light',
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        mb: 2,
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {assignment.teamName}
                      </Typography>
                      {!assignment.valid && (
                        <Chip
                          label={`${assignment.errors.length} error${assignment.errors.length > 1 ? 'es' : ''}`}
                          size="small"
                          color="error"
                        />
                      )}
                    </Box>

                    {assignment.candidates.length === 0 ? (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Este equipo no tiene asignaciones en el Paso 4.
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 220, flex: 1 }}>
                          <InputLabel>Rol líder *</InputLabel>
                          <Select
                            value={assignment.leaderRole}
                            label="Rol líder *"
                            onChange={(e) =>
                              handleLeaderChange(assignment.teamId, { leaderRole: e.target.value })
                            }
                            error={assignment.errors.some((e) => e.includes('Rol líder'))}
                          >
                            <MenuItem value="">— Seleccioná —</MenuItem>
                            {uniqueRoles.map((role) => (
                              <MenuItem key={role} value={role}>{role}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 220, flex: 1 }}>
                          <InputLabel>Persona líder *</InputLabel>
                          <Select
                            value={assignment.leaderPerson}
                            label="Persona líder *"
                            disabled={!assignment.leaderRole}
                            onChange={(e) =>
                              handleLeaderChange(assignment.teamId, { leaderPerson: e.target.value })
                            }
                            error={assignment.errors.some((e) => e.includes('Persona líder'))}
                          >
                            <MenuItem value="">— Seleccioná —</MenuItem>
                            {personsForRole.map((person) => (
                              <MenuItem key={person} value={person}>{person}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}

                    {!assignment.valid && (
                      <Box sx={{ mt: 1 }}>
                        {assignment.errors.map((e) => (
                          <Typography key={e} variant="caption" sx={{ color: 'error.main', display: 'block' }}>
                            • {e}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Generate JSON */}
      <Box
        sx={{
          p: 3,
          borderRadius: 3,
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
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.dark' }}>
            Estructura lista para exportar
          </Typography>
          <Typography variant="body2" sx={{ color: 'primary.dark' }}>
            {step3.catalog.length} equipos · {step4.catalog.filter((a) => a.valid).length} asignaciones
            válidas
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<DataObjectIcon />}
          onClick={handleGenerateJson}
          disabled={summary.hasErrors && step5.assignments.length > 0}
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
