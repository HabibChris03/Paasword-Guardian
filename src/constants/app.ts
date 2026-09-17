export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Password Guardian';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
// All keys are namespaced to avoid collisions.
export const STORAGE_KEYS = {
  // SecureStore — sensitive
  VAULT_KEY_MATERIAL:  'pg.vault.key-material',      // VaultKeyMaterial JSON
  VAULT_CREDENTIALS:   'pg.vault.credentials',        // Encrypted credentials JSON
  VAULT_CATEGORIES:    'pg.vault.categories',         // Custom categories JSON
  BIOMETRIC_VAULT_KEY: 'pg.vault.biometric-key',      // In-hardware secure biometric VEK token

  // AsyncStorage — non-sensitive settings & metadata
  APP_SETTINGS:        'pg.settings',
  ACTIVITY_LOG:        'pg.activity',
  BREACH_SCAN_RESULT:  'pg.breach.result',
  BREACH_NEWS_CACHE:   'pg.breach.news_cache',
  BREACH_NEWS_TIMESTAMP: 'pg.breach.news_timestamp',
  BACKUP_METADATA:     'pg.backup.metadata',
  USER_PROFILE:        'pg.profile',
  ONBOARDING_DONE:     'pg.onboarding.complete',
  FIRST_TIME:          'pg.first-time',
} as const;

// ─── Security Defaults ────────────────────────────────────────────────────────
export const SECURITY = {
  PBKDF2_ITERATIONS:        10_000,
  PBKDF2_KEY_SIZE:          32,      // bytes → 256-bit key
  SALT_LENGTH:              32,      // bytes
  IV_LENGTH:                16,      // bytes, for AES-CBC
  MIN_MASTER_PASSWORD_LEN:  10,
  MAX_CREDENTIAL_NOTES_LEN: 1000,
  // SecureStore has a ~2048 char limit per key
  SECURE_STORE_CHUNK_SIZE:  1900,
  VERIFIER_SENTINEL:        'pg-vault-auth-check-v1',
} as const;

// ─── Timeouts ─────────────────────────────────────────────────────────────────
export const TIMEOUTS = {
  CLIPBOARD_CLEAR_DEFAULT:  30,      // seconds
  PASSWORD_REVEAL_DEFAULT:  15,      // seconds
  AUTO_LOCK_DEFAULT:        5,       // minutes
  BREACH_SCAN_COOLDOWN:     60 * 60, // seconds between scans (1 hour)
} as const;

// ─── Password Generator Defaults ─────────────────────────────────────────────
export const GENERATOR_DEFAULTS = {
  LENGTH:              20,
  USE_UPPERCASE:       true,
  USE_LOWERCASE:       true,
  USE_NUMBERS:         true,
  USE_SYMBOLS:         true,
  AVOID_AMBIGUOUS:     false,
  MIN_LENGTH:          8,
  MAX_LENGTH:          64,
} as const;

// ─── Char sets (no Math.random — uses crypto.getRandomValues) ────────────────
export const CHARSETS = {
  UPPERCASE:           'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  LOWERCASE:           'abcdefghijklmnopqrstuvwxyz',
  NUMBERS:             '0123456789',
  SYMBOLS:             '!@#$%^&*()-_=+[]{}|;:,.<>?',
  AMBIGUOUS:           'Il1O0',
} as const;

// ─── Password Age Threshold ───────────────────────────────────────────────────
export const PASSWORD_AGE_THRESHOLD_DAYS = 90;

// ─── Mock Data Flag ───────────────────────────────────────────────────────────
// Set to false to ship without mock data
export const INCLUDE_MOCK_DATA = false;
