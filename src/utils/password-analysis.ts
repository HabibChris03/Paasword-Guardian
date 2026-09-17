import type { PasswordStrength } from '../types/models';

export interface PasswordAnalysis {
  strength: PasswordStrength;
  score: number;           // 0–100
  entropy: number;         // bits
  length: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  issues: string[];
  suggestions: string[];
}

const COMMON_PATTERNS = [
  /^[a-z]+$/i,             // letters only
  /^[0-9]+$/,              // digits only
  /^(.)\1+$/,              // all same char
  /012|123|234|345|456|567|678|789|890/, // sequential digits
  /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // sequential letters
  /qwerty|asdf|zxcv|qazwsx|1qaz|2wsx/i, // keyboard patterns
  /password|passw0rd|p@ssword|passwd/i,  // common passwords
  /^[a-z]+[0-9]+$/i,      // simple word+number
];

/**
 * Calculates the entropy of a password in bits.
 * entropy = length × log2(character-pool-size)
 */
function calculateEntropy(password: string): number {
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33; // common symbols

  if (poolSize === 0) return 0;
  return Math.round(password.length * Math.log2(poolSize));
}

/**
 * Analyzes a password and returns a structured analysis.
 * This is purely client-side — no network calls.
 */
export function analyzePassword(password: string): PasswordAnalysis {
  const length = password.length;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers  = /[0-9]/.test(password);
  const hasSymbols  = /[^a-zA-Z0-9]/.test(password);
  const entropy     = calculateEntropy(password);

  const issues: string[] = [];
  const suggestions: string[] = [];

  if (length === 0) {
    return {
      strength: 'very-weak', score: 0, entropy: 0, length: 0,
      hasUppercase: false, hasLowercase: false, hasNumbers: false, hasSymbols: false,
      issues: ['Password is empty'], suggestions: ['Enter a password'],
    };
  }

  // Scoring
  let score = 0;

  // Length scoring (max 40 pts)
  if (length >= 20)      score += 40;
  else if (length >= 16) score += 33;
  else if (length >= 12) score += 24;
  else if (length >= 10) score += 18;
  else if (length >= 8)  score += 12;
  else                   score += 5;

  // Character variety (max 40 pts)
  if (hasUppercase) score += 10;
  if (hasLowercase) score += 10;
  if (hasNumbers)   score += 10;
  if (hasSymbols)   score += 10;

  // Entropy bonus (max 20 pts)
  if (entropy >= 80)      score += 20;
  else if (entropy >= 60) score += 15;
  else if (entropy >= 40) score += 10;
  else if (entropy >= 28) score += 5;

  // Pattern penalties
  for (const pattern of COMMON_PATTERNS) {
    if (pattern.test(password)) {
      score = Math.max(0, score - 20);
      break;
    }
  }

  // Repetition penalty
  const uniqueChars = new Set(password).size;
  const uniqueRatio = uniqueChars / length;
  if (uniqueRatio < 0.3) score = Math.max(0, score - 15);

  score = Math.min(100, Math.max(0, score));

  // Issues & suggestions
  if (length < 10) {
    issues.push('Password is too short');
    suggestions.push('Use at least 10 characters (12+ recommended)');
  }
  if (!hasUppercase) {
    issues.push('No uppercase letters');
    suggestions.push('Add uppercase letters (A–Z)');
  }
  if (!hasLowercase) {
    issues.push('No lowercase letters');
    suggestions.push('Add lowercase letters (a–z)');
  }
  if (!hasNumbers) {
    issues.push('No numbers');
    suggestions.push('Include numbers (0–9)');
  }
  if (!hasSymbols) {
    issues.push('No special characters');
    suggestions.push('Add symbols like !@#$%^&*');
  }
  if (entropy < 40) {
    issues.push('Password is predictable');
    suggestions.push('Use a more random combination of characters');
  }

  // Strength mapping
  let strength: PasswordStrength;
  if (score >= 80)      strength = 'strong';
  else if (score >= 60) strength = 'good';
  else if (score >= 40) strength = 'fair';
  else if (score >= 20) strength = 'weak';
  else                  strength = 'very-weak';

  return {
    strength, score, entropy, length,
    hasUppercase, hasLowercase, hasNumbers, hasSymbols,
    issues, suggestions,
  };
}

/**
 * Checks if a password is reused among a list of known passwords.
 * Comparison is done in memory — never sent to backend.
 */
export function isPasswordReused(password: string, otherPasswords: string[]): boolean {
  return otherPasswords.some(p => p === password);
}

/**
 * Returns the strength score as a 0–1 ratio for progress bars.
 */
export function strengthToProgress(strength: PasswordStrength): number {
  switch (strength) {
    case 'very-weak': return 0.1;
    case 'weak':      return 0.28;
    case 'fair':      return 0.52;
    case 'good':      return 0.76;
    case 'strong':    return 1.0;
    default:          return 0;
  }
}
