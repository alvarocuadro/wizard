import { describe, it, expect } from 'vitest';
import {
  validateRequired,
  validateName,
  validateEmail,
  validateMaxLength,
  validateDateFormat,
  validateWorkMode,
} from '../utils/validators';

describe('validateRequired', () => {
  it('returns error for empty string', () => {
    expect(validateRequired('')).toBeTruthy();
  });
  it('returns error for whitespace-only string', () => {
    expect(validateRequired('   ')).toBeTruthy();
  });
  it('returns null for valid value', () => {
    expect(validateRequired('Juan')).toBeNull();
  });
});

describe('validateName', () => {
  it('returns error for empty string', () => {
    expect(validateName('')).toBeTruthy();
  });
  it('returns error for whitespace-only', () => {
    expect(validateName('   ')).toBeTruthy();
  });
  it('returns error for string with emoji', () => {
    expect(validateName('Juan 😀')).toBeTruthy();
  });
  it('returns error for emoji-only', () => {
    expect(validateName('🎉')).toBeTruthy();
  });
  it('returns null for normal name', () => {
    expect(validateName('Juan Pérez')).toBeNull();
  });
  it('returns null for name with accents', () => {
    expect(validateName('María José')).toBeNull();
  });
});

describe('validateEmail', () => {
  it('returns null for empty (not responsible for required)', () => {
    expect(validateEmail('')).toBeNull();
  });
  it('returns error for missing @', () => {
    expect(validateEmail('juanexample.com')).toBeTruthy();
  });
  it('returns error for missing domain', () => {
    expect(validateEmail('juan@')).toBeTruthy();
  });
  it('returns null for valid email', () => {
    expect(validateEmail('juan@example.com')).toBeNull();
  });
  it('returns null for corporate email', () => {
    expect(validateEmail('j.perez@wellio.io')).toBeNull();
  });
});

describe('validateMaxLength', () => {
  it('returns error when value exceeds maxLength', () => {
    expect(validateMaxLength('a'.repeat(41), 40)).toBeTruthy();
  });
  it('returns null when value equals maxLength', () => {
    expect(validateMaxLength('a'.repeat(40), 40)).toBeNull();
  });
  it('returns null when value is under maxLength', () => {
    expect(validateMaxLength('hola', 40)).toBeNull();
  });
});

describe('validateDateFormat', () => {
  it('returns null for empty string', () => {
    expect(validateDateFormat('')).toBeNull();
  });
  it('returns error for ISO format', () => {
    expect(validateDateFormat('2026-01-15')).toBeTruthy();
  });
  it('returns error for invalid date', () => {
    expect(validateDateFormat('32/01/2026')).toBeTruthy();
  });
  it('returns error for month 13', () => {
    expect(validateDateFormat('01/13/2026')).toBeTruthy();
  });
  it('returns null for valid DD/MM/AAAA', () => {
    expect(validateDateFormat('15/01/2026')).toBeNull();
  });
  it('returns null for leap year date', () => {
    expect(validateDateFormat('29/02/2024')).toBeNull();
  });
  it('returns error for invalid leap year date', () => {
    expect(validateDateFormat('29/02/2025')).toBeTruthy();
  });
});

describe('validateWorkMode', () => {
  it('returns null for empty string', () => {
    expect(validateWorkMode('')).toBeNull();
  });
  it('returns null for Presencial', () => {
    expect(validateWorkMode('Presencial')).toBeNull();
  });
  it('returns null for Híbrido', () => {
    expect(validateWorkMode('Híbrido')).toBeNull();
  });
  it('returns null for Remoto', () => {
    expect(validateWorkMode('Remoto')).toBeNull();
  });
  it('returns error for lowercase presencial', () => {
    expect(validateWorkMode('presencial')).toBeTruthy();
  });
  it('returns error for unknown value', () => {
    expect(validateWorkMode('Home Office')).toBeTruthy();
  });
});
