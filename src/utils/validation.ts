import { SECURITY } from '../constants/app';

// ─── Master Password Validation ───────────────────────────────────────────────
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMasterPassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < SECURITY.MIN_MASTER_PASSWORD_LEN) {
    errors.push(`Must be at least ${SECURITY.MIN_MASTER_PASSWORD_LEN} characters long`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain at least one number');
  }

  return { valid: errors.length === 0, errors };
}

export function validatePasswordsMatch(password: string, confirm: string): boolean {
  return password === confirm;
}

// ─── Credential Form Validation ───────────────────────────────────────────────
export interface CredentialValidationErrors {
  title?: string;
  username?: string;
  password?: string;
  website?: string;
}

export function validateCredentialForm(data: {
  title: string;
  username: string;
  password: string;
  website: string;
}): CredentialValidationErrors {
  const errors: CredentialValidationErrors = {};

  if (!data.title.trim()) {
    errors.title = 'Account name is required';
  } else if (data.title.trim().length > 100) {
    errors.title = 'Account name must be under 100 characters';
  }

  if (!data.username.trim()) {
    errors.username = 'Username or email is required';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  }

  if (data.website && !/^(https?:\/\/|www\.)/.test(data.website) && data.website.includes(' ')) {
    errors.website = 'Enter a valid website URL';
  }

  return errors;
}

// ─── URL Sanitization ─────────────────────────────────────────────────────────
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

// ─── Generic helpers ──────────────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
