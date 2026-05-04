import { describe, expect, it } from 'vitest';
import {
  STEP1_TEMPLATE_HEADERS,
  buildStep1TemplateMapping,
  validateStep1TemplateHeaders,
} from '../utils/step1Template';

describe('step1Template', () => {
  it('accepts the expected template headers', () => {
    expect(validateStep1TemplateHeaders(STEP1_TEMPLATE_HEADERS)).toBeNull();
  });

  it('rejects templates with headers in a different order', () => {
    const reordered = [...STEP1_TEMPLATE_HEADERS];
    [reordered[0], reordered[1]] = [reordered[1], reordered[0]];

    expect(validateStep1TemplateHeaders(reordered)).toContain('La columna 1 debe ser');
  });

  it('builds the fixed mapping from the template headers', () => {
    const mapping = buildStep1TemplateMapping(STEP1_TEMPLATE_HEADERS);

    expect(mapping.firstName).toBe('Nombres');
    expect(mapping.lastName).toBe('Apellidos');
    expect(mapping.workEmail).toBe('Email');
    expect(mapping.workMode).toBe('Modalidad de trabajo');
  });
});
