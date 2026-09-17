/**
 * Mock data for development.
 *
 * IMPORTANT: This is clearly labeled mock data.
 * - Passwords are fake — never real credentials.
 * - Set INCLUDE_MOCK_DATA = false in app.ts before release.
 * - No actual users' credentials are stored here.
 */
import type { Credential, EncryptedField } from '../types/models';

/** A placeholder EncryptedField (represents unencrypted dummy data in dev mode only). */
function mockEncrypted(value: string): EncryptedField {
  return { iv: '00000000000000000000000000000000', data: btoa(value) };
}

const now = new Date().toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const MOCK_CREDENTIALS: (Omit<Credential, 'encryptedPassword' | 'encryptedNotes'> & {
  _mockPassword: string;
  _mockNotes: string;
})[] = [
  {
    id: 'mock-001',
    title: 'Google Account',
    website: 'https://accounts.google.com',
    username: 'alex.rivera@gmail.com',
    categoryId: 'email',
    favorite: true,
    tags: ['personal', 'important'],
    createdAt: daysAgo(120),
    updatedAt: daysAgo(30),
    lastAccessedAt: daysAgo(2),
    passwordStrength: 'strong',
    passwordLength: 20,
    hasUppercase: true, hasLowercase: true, hasNumbers: true, hasSymbols: true,
    isCompromised: false, isReused: false,
    lastBreachCheck: daysAgo(7),
    _mockPassword: 'G00gl3@SecurePass!2026',
    _mockNotes: '2FA enabled via Authenticator app.',
  },
  {
    id: 'mock-002',
    title: 'GitHub',
    website: 'https://github.com',
    username: 'alex-rivera-dev',
    categoryId: 'development',
    favorite: true,
    tags: ['work', 'dev'],
    createdAt: daysAgo(200),
    updatedAt: daysAgo(60),
    lastAccessedAt: daysAgo(1),
    passwordStrength: 'strong',
    passwordLength: 24,
    hasUppercase: true, hasLowercase: true, hasNumbers: true, hasSymbols: true,
    isCompromised: false, isReused: false,
    lastBreachCheck: daysAgo(7),
    _mockPassword: 'Gh!7xK#mN2pQ9rLw4vZs8dAe',
    _mockNotes: 'SSH key also configured. Token stored separately.',
  },
  {
    id: 'mock-003',
    title: 'Netflix',
    website: 'https://www.netflix.com',
    username: 'alex.rivera@gmail.com',
    categoryId: 'entertainment',
    favorite: false,
    tags: ['streaming'],
    createdAt: daysAgo(400),
    updatedAt: daysAgo(200),
    lastAccessedAt: daysAgo(3),
    passwordStrength: 'fair',
    passwordLength: 8,
    hasUppercase: true, hasLowercase: true, hasNumbers: true, hasSymbols: false,
    isCompromised: false, isReused: false,
    lastBreachCheck: null,
    _mockPassword: 'Alex1234',
    _mockNotes: '',
  },
  {
    id: 'mock-004',
    title: 'Chase Bank',
    website: 'https://www.chase.com',
    username: 'alex.rivera',
    categoryId: 'banking',
    favorite: true,
    tags: ['banking', 'important'],
    createdAt: daysAgo(500),
    updatedAt: daysAgo(10),
    lastAccessedAt: daysAgo(5),
    passwordStrength: 'good',
    passwordLength: 16,
    hasUppercase: true, hasLowercase: true, hasNumbers: true, hasSymbols: false,
    isCompromised: false, isReused: false,
    lastBreachCheck: daysAgo(14),
    _mockPassword: 'ChaseBank2026Secure',
    _mockNotes: 'Online banking. 2FA via SMS.',
  },
  {
    id: 'mock-005',
    title: 'Microsoft 365',
    website: 'https://login.microsoft.com',
    username: 'a.rivera@company.com',
    categoryId: 'work',
    favorite: false,
    tags: ['work'],
    createdAt: daysAgo(180),
    updatedAt: daysAgo(90),
    lastAccessedAt: daysAgo(1),
    passwordStrength: 'good',
    passwordLength: 14,
    hasUppercase: true, hasLowercase: true, hasNumbers: true, hasSymbols: true,
    isCompromised: false, isReused: false,
    lastBreachCheck: daysAgo(7),
    _mockPassword: 'M$Office!2026Wk',
    _mockNotes: 'Work account. Managed by IT.',
  },
  {
    id: 'mock-006',
    title: 'Amazon',
    website: 'https://www.amazon.com',
    username: 'alex.rivera@gmail.com',
    categoryId: 'shopping',
    favorite: false,
    tags: ['shopping'],
    createdAt: daysAgo(600),
    updatedAt: daysAgo(120),
    lastAccessedAt: daysAgo(7),
    passwordStrength: 'weak',
    passwordLength: 7,
    hasUppercase: false, hasLowercase: true, hasNumbers: true, hasSymbols: false,
    isCompromised: true, isReused: false,
    lastBreachCheck: daysAgo(3),
    _mockPassword: 'amazon7',
    _mockNotes: '',
  },
  {
    id: 'mock-007',
    title: 'Instagram',
    website: 'https://www.instagram.com',
    username: '@alex.rivera.photo',
    categoryId: 'social',
    favorite: false,
    tags: ['social', 'personal'],
    createdAt: daysAgo(300),
    updatedAt: daysAgo(150),
    lastAccessedAt: daysAgo(2),
    passwordStrength: 'fair',
    passwordLength: 9,
    hasUppercase: true, hasLowercase: true, hasNumbers: true, hasSymbols: false,
    isCompromised: false, isReused: true,
    lastBreachCheck: daysAgo(7),
    _mockPassword: 'Rivera123',
    _mockNotes: '',
  },
  {
    id: 'mock-008',
    title: 'University Portal',
    website: 'https://my.university.edu',
    username: '20210543',
    categoryId: 'education',
    favorite: false,
    tags: ['education'],
    createdAt: daysAgo(800),
    updatedAt: daysAgo(365),
    lastAccessedAt: daysAgo(30),
    passwordStrength: 'fair',
    passwordLength: 10,
    hasUppercase: false, hasLowercase: true, hasNumbers: true, hasSymbols: false,
    isCompromised: false, isReused: false,
    lastBreachCheck: null,
    _mockPassword: 'student2021',
    _mockNotes: 'Student ID login.',
  },
];

/**
 * Returns MOCK_CREDENTIALS as proper Credential objects with mock encrypted fields.
 * Only used in development mode.
 */
export function getMockCredentials(): Credential[] {
  return MOCK_CREDENTIALS.map(({ _mockPassword, _mockNotes, ...rest }) => ({
    ...rest,
    encryptedPassword: mockEncrypted(_mockPassword),
    encryptedNotes:    _mockNotes ? mockEncrypted(_mockNotes) : null,
  }));
}
