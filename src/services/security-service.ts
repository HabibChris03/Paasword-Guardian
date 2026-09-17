/**
 * SecurityService — vault security analysis and score computation.
 * All analysis runs locally — no data leaves the device.
 */
import { CryptoService } from '../crypto/crypto-service';
import { VaultService } from './vault-service';
import { analyzePassword } from '../utils/password-analysis';
import { PASSWORD_AGE_THRESHOLD_DAYS } from '../constants/app';
import type { SecurityReport, SecurityIssue, Credential } from '../types/models';

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export const SecurityService = {
  /**
   * Computes a full SecurityReport for the vault.
   * Requires the vault key to decrypt passwords for reuse/strength analysis.
   */
  async generateReport(vaultKey: string): Promise<SecurityReport> {
    const credentials = await VaultService.getCredentials();
    const total       = credentials.length;
    const issues: SecurityIssue[] = [];

    if (total === 0) {
      return {
        score: 100, grade: 'A', totalCredentials: 0,
        strongPasswords: 0, weakPasswords: 0, reusedPasswords: 0,
        compromisedPasswords: 0, oldPasswords: 0, missingUrls: 0,
        issues: [], generatedAt: new Date().toISOString(),
      };
    }

    // Decrypt all passwords for analysis (in memory only)
    const passwordMap = new Map<string, string>();  // credId → plaintext password
    for (const cred of credentials) {
      const pwd = CryptoService.decryptField(cred.encryptedPassword, vaultKey);
      if (pwd) passwordMap.set(cred.id, pwd);
    }

    // Detect reuse
    const reversePwdMap = new Map<string, string[]>(); // pwd → [credIds]
    for (const [id, pwd] of passwordMap) {
      const existing = reversePwdMap.get(pwd) ?? [];
      reversePwdMap.set(pwd, [...existing, id]);
    }
    const reusedIds = new Set<string>();
    for (const ids of reversePwdMap.values()) {
      if (ids.length > 1) ids.forEach(id => reusedIds.add(id));
    }

    let weakCount       = 0;
    let strongCount     = 0;
    let reusedCount     = 0;
    let compromisedCount = 0;
    let oldCount        = 0;
    let missingUrlCount = 0;

    for (const cred of credentials) {
      const pwd      = passwordMap.get(cred.id) ?? '';
      const analysis = analyzePassword(pwd);

      // Strength issues
      if (analysis.strength === 'very-weak' || analysis.strength === 'weak') {
        weakCount++;
        issues.push({
          type: 'weak', credentialId: cred.id, credentialTitle: cred.title,
          severity: analysis.strength === 'very-weak' ? 'critical' : 'high',
          description: `Password for "${cred.title}" is ${analysis.strength.replace('-', ' ')}.`,
          recommendation: 'Use the password generator to create a stronger password.',
        });
      } else if (analysis.strength === 'fair') {
        weakCount++;
        issues.push({
          type: 'weak', credentialId: cred.id, credentialTitle: cred.title,
          severity: 'medium',
          description: `Password for "${cred.title}" could be stronger.`,
          recommendation: 'Consider increasing length and adding special characters.',
        });
      } else {
        strongCount++;
      }

      // Reuse issues
      if (reusedIds.has(cred.id)) {
        reusedCount++;
        issues.push({
          type: 'reused', credentialId: cred.id, credentialTitle: cred.title,
          severity: 'high',
          description: `Password for "${cred.title}" is used on multiple accounts.`,
          recommendation: 'Use a unique password for each account.',
        });
      }

      // Compromised
      if (cred.isCompromised) {
        compromisedCount++;
        issues.push({
          type: 'compromised', credentialId: cred.id, credentialTitle: cred.title,
          severity: 'critical',
          description: `"${cred.title}" may have appeared in a data breach.`,
          recommendation: 'Change this password immediately and enable 2FA if possible.',
        });
      }

      // Old passwords
      const ageInDays = daysSince(cred.updatedAt);
      if (ageInDays > PASSWORD_AGE_THRESHOLD_DAYS) {
        oldCount++;
        issues.push({
          type: 'old', credentialId: cred.id, credentialTitle: cred.title,
          severity: 'low',
          description: `Password for "${cred.title}" hasn't been updated in ${Math.floor(ageInDays / 30)} months.`,
          recommendation: 'Update old passwords regularly for better security.',
        });
      }

      // Missing URL
      if (!cred.website) {
        missingUrlCount++;
        issues.push({
          type: 'missing-url', credentialId: cred.id, credentialTitle: cred.title,
          severity: 'low',
          description: `"${cred.title}" is missing a website URL.`,
          recommendation: 'Add the website URL to make autofill easier.',
        });
      }
    }

    // Score calculation
    let score = 100;
    if (total > 0) {
      const weakPenalty       = (weakCount       / total) * 35;
      const reusedPenalty     = (reusedCount     / total) * 30;
      const compromisedPenalty = (compromisedCount / total) * 25;
      const oldPenalty        = (oldCount        / total) * 10;
      score = Math.max(0, Math.round(100 - weakPenalty - reusedPenalty - compromisedPenalty - oldPenalty));
    }

    const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

    return {
      score, grade, totalCredentials: total,
      strongPasswords:     strongCount,
      weakPasswords:       weakCount,
      reusedPasswords:     reusedCount,
      compromisedPasswords: compromisedCount,
      oldPasswords:        oldCount,
      missingUrls:         missingUrlCount,
      issues,
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * Returns the score label based on the score value.
   */
  getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Needs Work';
    return 'At Risk';
  },

  /**
   * Returns the score description for the UI.
   */
  getScoreDescription(score: number, issues: SecurityIssue[]): string {
    if (issues.length === 0) return 'All your passwords look great!';
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      return `${criticalIssues.length} critical issue${criticalIssues.length > 1 ? 's' : ''} need${criticalIssues.length > 1 ? '' : 's'} immediate attention.`;
    }
    const topIssue = issues[0];
    const count = issues.filter(i => i.type === topIssue.type).length;
    switch (topIssue.type) {
      case 'weak':      return `${count} password${count > 1 ? 's are' : ' is'} weak or reused.`;
      case 'reused':    return `${count} password${count > 1 ? 's are' : ' is'} reused across accounts.`;
      case 'old':       return `${count} password${count > 1 ? 's haven\'t' : ' hasn\'t'} been updated recently.`;
      default:          return `${issues.length} security issue${issues.length > 1 ? 's' : ''} detected.`;
    }
  },
};

export default SecurityService;
