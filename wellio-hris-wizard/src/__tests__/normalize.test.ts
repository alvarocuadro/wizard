import { describe, it, expect } from 'vitest';
import { normalize } from '../utils/normalize';

describe('normalize', () => {
  it('lowercases', () => {
    expect(normalize('NOMBRE')).toBe('nombre');
  });
  it('removes accents', () => {
    expect(normalize('Número')).toBe('numero');
  });
  it('replaces hyphens with space', () => {
    expect(normalize('first-name')).toBe('first name');
  });
  it('replaces underscores with space', () => {
    expect(normalize('first_name')).toBe('first name');
  });
  it('collapses multiple spaces', () => {
    expect(normalize('  hello   world  ')).toBe('hello world');
  });
  it('handles null/undefined', () => {
    expect(normalize(null)).toBe('');
    expect(normalize(undefined)).toBe('');
  });
  it('handles numbers', () => {
    expect(normalize(42)).toBe('42');
  });
  it('removes special chars and trims result', () => {
    // ! → space → trimmed to 'nombre'
    expect(normalize('nombre!')).toBe('nombre');
  });
  it('preserves @ but replaces dots (used for column-name matching, not email storage)', () => {
    // dots are not in the allowed set [a-z0-9@()\s/]
    expect(normalize('juan@example.com')).toBe('juan@example com');
  });
});
