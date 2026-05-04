import { useEffect, useRef } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { ValidationSummaryBanner } from '../ui/ValidationSummaryBanner';
import { SourceFileChoice } from './SourceFileChoice';
import { CharCounterInput } from '../ui/CharCounterInput';
import { useWizardContext } from '../../context/WizardContext';
import { useRolesCatalog } from '../../hooks/useRolesCatalog';
import { useFileParser } from '../../hooks/useFileParser';
import { NONE_VALUE } from '../../utils/constants';
import type { FileParseResult, RoleCatalogItem } from '../../utils/types';

export function Step2Panel() {
  const { state, dispatch } = useWizardContext();
  const { step1, step2 } = state;
  const rolesCatalog = useRolesCatalog();
  const { parseStored, error, clearError } = useFileParser();
  const initialLoadDone = useRef(false);

  useEffect(() => {
    async function loadSameFile() {
      if (!step1.source?.fileName) return;

      try {
        const result = await parseStored(step1.source.fileName, { mode: 'step2Roles' });
        dispatch({ type: 'S2_SET_SOURCE_DATA', payload: { mode: 'same', ...result } });
        dispatch({ type: 'S2_SET_COLUMN', payload: 'A' });
        dispatch({
          type: 'S2_SET_CATALOG',
          payload: rolesCatalog.build(result.rows, step2.catalog),
        });
        dispatch({ type: 'RESET_FROM_STEP', payload: 3 });
      } catch {
        dispatch({ type: 'S2_SET_COLUMN', payload: NONE_VALUE });
        dispatch({ type: 'S2_SET_CATALOG', payload: [] });
      }
    }

    if (step2.sourceData.mode !== 'same') return;
    if (initialLoadDone.current && step2.sourceData.fileName === step1.source?.fileName) return;

    initialLoadDone.current = true;
    void loadSameFile();
  }, [dispatch, parseStored, rolesCatalog, step1.source?.fileName, step2.catalog, step2.sourceData.fileName, step2.sourceData.mode]);

  function handleSameFile() {
    clearError();
    dispatch({
      type: 'S2_SET_SOURCE_DATA',
      payload: {
        mode: 'same',
        fileName: '',
        headers: [],
        rows: [],
        headerRowNumber: 1,
        dataStartRowNumber: 2,
      },
    });
    dispatch({ type: 'S2_SET_COLUMN', payload: NONE_VALUE });
    dispatch({ type: 'S2_SET_CATALOG', payload: [] });
    dispatch({ type: 'RESET_FROM_STEP', payload: 3 });
    initialLoadDone.current = false;
  }

  function handleOtherFile(result: FileParseResult) {
    clearError();
    dispatch({ type: 'S2_SET_SOURCE_DATA', payload: { mode: 'other', ...result } });
    dispatch({ type: 'S2_SET_COLUMN', payload: 'A' });
    dispatch({ type: 'S2_SET_CATALOG', payload: rolesCatalog.build(result.rows, []) });
    dispatch({ type: 'RESET_FROM_STEP', payload: 3 });
  }

  function handleRoleChange(id: string, changes: Partial<RoleCatalogItem>) {
    const updated = step2.catalog.map((role) => (role.id === id ? { ...role, ...changes } : role));
    const revalidated = rolesCatalog.validate(updated);
    dispatch({ type: 'S2_SET_CATALOG', payload: revalidated });
  }

  const summary = rolesCatalog.summary(step2.catalog);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        Paso 2: Catalogo de roles
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Los datos se leen desde la hoja <strong>Roles</strong>. La columna A define el nombre
        del rol y la columna B marca <strong>Tiene reportes</strong> cuando contiene "si".
      </Typography>

      <Card variant="outlined" sx={{ mb: 4, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Archivo fuente
          </Typography>
          <SourceFileChoice
            step1FileName={step1.source?.fileName ?? ''}
            mode={step2.sourceData.mode}
            onSameFile={handleSameFile}
            onOtherFile={handleOtherFile}
            currentOtherFileName={
              step2.sourceData.mode === 'other' ? step2.sourceData.fileName : undefined
            }
            parseMode="step2Roles"
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {step2.sourceData.fileName && (
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 4 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Hoja Roles detectada
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Se toman los titulos de la fila {step2.sourceData.headerRowNumber} y los datos
              desde la fila {step2.sourceData.dataStartRowNumber}. La columna A es obligatoria
              y la B interpreta "si" como rol con reportes.
            </Typography>
          </CardContent>
        </Card>
      )}

      {step2.catalog.length > 0 && (
        <Box>
          <ValidationSummaryBanner
            total={summary.total}
            valid={summary.valid}
            invalid={summary.invalid}
            hasErrors={summary.hasErrors}
            label="roles"
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {step2.catalog.map((role) => (
              <Card
                key={role.id}
                variant="outlined"
                sx={{ borderRadius: 2, borderColor: role.valid ? 'divider' : 'error.light' }}
              >
                <CardContent sx={{ py: '12px !important', px: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <CharCounterInput
                        value={role.name}
                        onChange={(value) => handleRoleChange(role.id, { name: value })}
                        maxLength={40}
                        label="Nombre del rol"
                        error={!role.valid}
                      />
                    </Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={role.hasReports}
                          onChange={(e) =>
                            handleRoleChange(role.id, { hasReports: e.target.checked })
                          }
                        />
                      }
                      label={<Typography variant="body2">Tiene reportes</Typography>}
                    />
                    {!role.valid && (
                      <Chip
                        label={role.errors.join(' · ')}
                        size="small"
                        color="error"
                        sx={{ maxWidth: 300 }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {step2.sourceData.fileName && step2.catalog.length === 0 && !error && (
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
            No se encontraron roles cargados en la hoja Roles.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
