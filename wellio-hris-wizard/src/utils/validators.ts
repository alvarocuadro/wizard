import { WORK_MODE_VALUES, type WorkModeValue } from './constants';

// ─── Primitive validators ─────────────────────────────────────────────────────

export function validateRequired(value: string): string | null {
  if (!value || value.trim() === '') return 'Campo obligatorio.';
  return null;
}

export function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Campo obligatorio.';
  if (/^\s+$/.test(value)) return 'No puede contener solo espacios en blanco.';
  // Unicode emoji detection
  if (/\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(trimmed)) {
    return 'No se permiten emojis.';
  }
  return null;
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null; // let validateRequired handle empty
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Formato de email inválido.';
  return null;
}

export function validateMaxLength(value: string, maxLength: number): string | null {
  if (value.trim().length > maxLength) return `Máximo ${maxLength} caracteres.`;
  return null;
}

export function validateDateFormat(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return 'Formato requerido: DD/MM/AAAA.';
  const [d, m, y] = trimmed.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return 'Fecha inválida.';
  }
  return null;
}

export function validateWorkMode(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!(WORK_MODE_VALUES as readonly string[]).includes(trimmed)) {
    return 'Debe ser Presencial, Híbrido o Remoto.';
  }
  return null;
}

// ─── Composite: validate a field value given its definition ──────────────────

export interface FieldValidationOptions {
  required?: boolean;
  type?: 'text' | 'email' | 'date' | 'enum';
  maxLength?: number;
  isNameField?: boolean;
}

export function validateFieldValue(value: string, opts: FieldValidationOptions): string[] {
  const errors: string[] = [];
  const trimmed = value.trim();

  if (opts.required) {
    const err = validateRequired(trimmed);
    if (err) { errors.push(err); return errors; }
  }
  if (!trimmed) return errors;

  if (opts.isNameField) {
    const err = validateName(trimmed);
    if (err) errors.push(err);
  }

  if (opts.maxLength) {
    const err = validateMaxLength(trimmed, opts.maxLength);
    if (err) errors.push(err);
  }

  if (opts.type === 'email') {
    const err = validateEmail(trimmed);
    if (err) errors.push(err);
  }

  if (opts.type === 'date') {
    const err = validateDateFormat(trimmed);
    if (err) errors.push(err);
  }

  if (opts.type === 'enum') {
    const err = validateWorkMode(trimmed);
    if (err) errors.push(err);
  }

  return errors;
}

// ─── Catalog-level validators ─────────────────────────────────────────────────

export function validateRoleName(name: string): string[] {
  const errors: string[] = [];
  const trimmed = name.trim();
  if (!trimmed) { errors.push('Nombre de rol: obligatorio.'); return errors; }
  if (trimmed.length > 40) errors.push('Nombre de rol: máximo 40 caracteres.');
  return errors;
}

export function validateTeamName(name: string): string[] {
  const errors: string[] = [];
  const trimmed = name.trim();
  if (!trimmed) { errors.push('Nombre de equipo: obligatorio.'); return errors; }
  if (trimmed.length > 40) errors.push('Nombre de equipo: máximo 40 caracteres.');
  return errors;
}

export function isValidWorkModeValue(value: string): value is WorkModeValue {
  return (WORK_MODE_VALUES as readonly string[]).includes(value);
}
