// ─── Encrypted Field ──────────────────────────────────────────────────────────
// Every sensitive value is stored as { iv, data } — never as plaintext.
export interface EncryptedField {
  iv: string;   // Base64-encoded IV (unique per field)
  data: string; // Base64-encoded AES-256-CBC ciphertext
}

// ─── Credential ───────────────────────────────────────────────────────────────
export type CredentialCategory =
  | 'social'
  | 'banking'
  | 'work'
  | 'email'
  | 'shopping'
  | 'entertainment'
  | 'development'
  | 'education'
  | 'other';

export type PasswordStrength = 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';

export interface Credential {
  id: string;
  title: string;
  website: string;
  username: string;
  encryptedPassword: EncryptedField;
  encryptedNotes: EncryptedField | null;
  encryptedTotpSecret?: EncryptedField | null;
  categoryId: CredentialCategory;
  favorite: boolean;
  tags: string[];
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
  lastAccessedAt: string | null;
  // Derived / cached — recalculated on decryption, never trusted blindly
  passwordStrength: PasswordStrength;
  passwordLength: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  // Security metadata
  isCompromised: boolean;
  isReused: boolean;
  lastBreachCheck: string | null;
}

// Credential with decrypted password (never stored, only in memory)
export interface DecryptedCredential extends Omit<Credential, 'encryptedPassword' | 'encryptedNotes' | 'encryptedTotpSecret'> {
  password: string;
  notes: string;
  totpSecret?: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id: CredentialCategory;
  name: string;
  icon: string;        // Ionicons name
  color: string;       // Hex color
  count?: number;      // populated at runtime
}

// ─── Vault Key Material ───────────────────────────────────────────────────────
// Stored in SecureStore — never the raw key or master password
export interface VaultKeyMaterial {
  salt: string;              // Base64 PBKDF2 salt
  wrappedVaultKey: string;   // VEK encrypted with KEK, Base64
  verifier: string;          // HMAC of known plaintext with KEK — for fast auth check
  iterations: number;        // PBKDF2 iteration count
  algorithm: 'PBKDF2-SHA256'; // Future-proofing
  createdAt: string;
  updatedAt: string;
}

// ─── Security Report ──────────────────────────────────────────────────────────
export interface SecurityIssue {
  type: 'weak' | 'reused' | 'compromised' | 'old' | 'missing-url' | 'no-2fa-hint';
  credentialId: string;
  credentialTitle: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface SecurityReport {
  score: number;              // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  totalCredentials: number;
  strongPasswords: number;
  weakPasswords: number;
  reusedPasswords: number;
  compromisedPasswords: number;
  oldPasswords: number;       // Not updated in > 90 days
  missingUrls: number;
  issues: SecurityIssue[];
  generatedAt: string;        // ISO 8601
}

// ─── Breach Result ────────────────────────────────────────────────────────────
export type BreachSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BreachResult {
  id: string;
  credentialId: string;
  credentialTitle: string;
  breachName: string;
  breachDate: string | null;  // ISO 8601 or null if unknown
  exposedData: string[];      // e.g. ['email', 'password', 'phone']
  severity: BreachSeverity;
  description: string;
  isResolved: boolean;
  detectedAt: string;
  // Privacy-preserving — no plaintext passwords
}

export interface BreachScanResult {
  scannedAt: string;
  totalChecked: number;
  affectedCount: number;
  safeCount: number;
  results: BreachResult[];
  nextScanAvailable: string | null; // ISO 8601 — rate limiting
}

// ─── Breach News Item (Public Incident Intelligence) ───────────────────────────
export interface BreachNewsItem {
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  addedDate: string;
  modifiedDate: string;
  pwnCount: number;
  description: string;
  logoUrl?: string;
  dataClasses: string[];
  isVerified: boolean;
  isSensitive: boolean;
  disclosureUrl?: string | null;
  matchedVaultCredentialId?: string;
  matchedCredentialTitle?: string;
}

// ─── Backup ───────────────────────────────────────────────────────────────────
export type BackupDestination = 'local' | 'cloud';
export type BackupStatus = 'idle' | 'in-progress' | 'success' | 'error';

export interface BackupMetadata {
  id: string;
  createdAt: string;
  destination: BackupDestination;
  sizeBytes: number;
  credentialCount: number;
  version: string;            // App version that created this backup
  isEncrypted: true;          // Always true — backup is always encrypted
  checksum: string;           // SHA-256 of encrypted payload
}

export interface EncryptedBackup {
  metadata: BackupMetadata;
  encryptedPayload: string;   // Base64 AES-256-CBC ciphertext of the full vault
  iv: string;
  salt: string;               // PBKDF2 salt used to re-derive key for backup
}

// ─── Activity / Notifications ─────────────────────────────────────────────────
export type ActivityType =
  | 'credential-added'
  | 'credential-updated'
  | 'credential-deleted'
  | 'credential-accessed'
  | 'vault-unlocked'
  | 'vault-locked'
  | 'backup-created'
  | 'backup-failed'
  | 'backup-restored'
  | 'breach-detected'
  | 'breach-resolved'
  | 'master-password-changed'
  | 'security-scan-complete'
  | 'weak-password-detected';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  description: string;        // User-friendly, no sensitive data
  timestamp: string;          // ISO 8601
  credentialId?: string;      // Optional link to a credential
  credentialTitle?: string;   // Display name — not the password
  isRead: boolean;
  severity: 'info' | 'warning' | 'danger' | 'success';
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export type AutoLockTimeout = 0 | 1 | 5 | 15 | 30 | 60; // minutes, 0 = never
export type ClipboardTimeout = 15 | 30 | 60 | 120;       // seconds

export interface AppSettings {
  // Security
  autoLockTimeout: AutoLockTimeout;      // minutes
  lockOnBackground: boolean;
  biometricEnabled: boolean;
  clipboardTimeout: ClipboardTimeout;    // seconds
  passwordRevealTimeout: number;         // seconds
  screenshotProtection: boolean;
  autoWipeOnFailedAttempts: boolean;
  // Monitoring
  breachMonitoringEnabled: boolean;
  securityNotificationsEnabled: boolean;
  // Backup
  autoBackupEnabled: boolean;
  autoBackupFrequency: 'daily' | 'weekly' | 'monthly';
  backupDestination: BackupDestination;
  // UI
  theme: 'light' | 'dark' | 'system';
  // Meta
  onboardingComplete: boolean;
  biometricSetupComplete: boolean;
  profileName: string;
  createdAt: string;
  updatedAt: string;
}

// ─── User Profile ─────────────────────────────────────────────────────────────
export interface UserProfile {
  name: string;
  vaultCreatedAt: string;
  lastUnlockedAt: string | null;
  totalCredentials: number;
}

// ─── Vault State ──────────────────────────────────────────────────────────────
export type VaultState = 'locked' | 'unlocked' | 'loading';
