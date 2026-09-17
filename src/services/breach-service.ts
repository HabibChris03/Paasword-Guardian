/**
 * BreachService — privacy-preserving breach detection and real-time breach intelligence.
 *
 * CRITICAL SECURITY NOTE:
 * Plaintext passwords are NEVER sent to any external service.
 * For news and public breaches, the public Have I Been Pwned breaches directory
 * is queried without transmitting any personal data or credentials.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VaultService } from './vault-service';
import { STORAGE_KEYS } from '../constants/app';
import type { BreachResult, BreachScanResult, BreachNewsItem } from '../types/models';

const HIBP_BREACHES_ENDPOINT = 'https://haveibeenpwned.com/api/v3/breaches';

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function extractDomain(urlOrText: string): string {
  if (!urlOrText) return '';
  let cleaned = urlOrText.trim().toLowerCase();
  cleaned = cleaned.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '');
  return cleaned.split('/')[0].split(':')[0].trim();
}

const FALLBACK_BREACH_NEWS: BreachNewsItem[] = [
  {
    name: 'Chess2026',
    title: 'Chess.com',
    domain: 'chess.com',
    breachDate: '2026-08-03',
    addedDate: '2026-09-13T13:09:11Z',
    modifiedDate: '2026-09-13T13:09:11Z',
    pwnCount: 4653212,
    description: 'Millions of records allegedly sourced from Chess.com were posted online. The data contained 7.3M rows with 4.6M unique email addresses, along with usernames, names, countries and data relating to users\' accounts.',
    logoUrl: 'https://logos.haveibeenpwned.com/Chess.png',
    dataClasses: ['Email addresses', 'Geographic locations', 'Names', 'Usernames'],
    isVerified: true,
    isSensitive: false,
    disclosureUrl: 'https://securityaffairs.com/197174/breaking-news/chess-com-leak-exposes-7-3-million-users-evidence-points-to-scraping.html',
  },
  {
    name: 'McKesson',
    title: 'McKesson',
    domain: 'mckesson.com',
    breachDate: '2026-08-21',
    addedDate: '2026-09-10T05:45:39Z',
    modifiedDate: '2026-09-10T05:45:39Z',
    pwnCount: 6404340,
    description: 'Healthcare and pharmaceutical company McKesson was targeted in a ShinyHunters extortion campaign. The group published an unauthorized corpus of 6.4M unique email addresses along with corporate records.',
    logoUrl: 'https://logos.haveibeenpwned.com/McKesson.png',
    dataClasses: ['Dates of birth', 'Email addresses', 'Names', 'Personal health data', 'Phone numbers'],
    isVerified: true,
    isSensitive: true,
    disclosureUrl: 'https://www.bleepingcomputer.com/news/security/mckesson-discloses-breach-after-shinyhunters-claims-patient-data-theft/',
  },
  {
    name: 'Ticketmaster',
    title: 'Ticketmaster',
    domain: 'ticketmaster.com',
    breachDate: '2024-05-27',
    addedDate: '2024-06-01T12:00:00Z',
    modifiedDate: '2024-06-01T12:00:00Z',
    pwnCount: 560000000,
    description: 'Ticketmaster suffered a breach after an unauthorized party obtained customer data from a cloud environment. Compromised data included names, addresses, emails, phone numbers, and payment details.',
    logoUrl: 'https://logos.haveibeenpwned.com/Ticketmaster.png',
    dataClasses: ['Email addresses', 'Names', 'Partial credit card data', 'Phone numbers', 'Physical addresses'],
    isVerified: true,
    isSensitive: false,
    disclosureUrl: 'https://www.bleepingcomputer.com/news/security/live-nation-confirms-ticketmaster-was-hacked-in-sec-filing/',
  },
  {
    name: 'Twitter200M',
    title: 'Twitter / X',
    domain: 'twitter.com',
    breachDate: '2023-01-04',
    addedDate: '2023-01-05T00:00:00Z',
    modifiedDate: '2023-01-05T00:00:00Z',
    pwnCount: 211522128,
    description: 'Over 200 million Twitter records containing email addresses, screen names, handles, account creation dates, and follower counts were leaked on an online hacking forum after being scraped.',
    logoUrl: 'https://logos.haveibeenpwned.com/Twitter.png',
    dataClasses: ['Email addresses', 'Names', 'Usernames'],
    isVerified: true,
    isSensitive: false,
    disclosureUrl: 'https://www.bleepingcomputer.com/news/security/200-million-twitter-users-email-addresses-leaked-on-hacker-forum/',
  },
  {
    name: 'Canva',
    title: 'Canva',
    domain: 'canva.com',
    breachDate: '2019-05-24',
    addedDate: '2019-05-24T00:00:00Z',
    modifiedDate: '2019-05-24T00:00:00Z',
    pwnCount: 137000000,
    description: 'Graphic design tool Canva suffered a massive data breach impacting 137 million subscribers. Exposed data included usernames, real names, email addresses, and passwords stored as hashes.',
    logoUrl: 'https://logos.haveibeenpwned.com/Canva.png',
    dataClasses: ['Email addresses', 'Names', 'Passwords', 'Usernames'],
    isVerified: true,
    isSensitive: false,
    disclosureUrl: 'https://www.zdnet.com/article/canva-data-breach-exposes-137-million-user-accounts/',
  },
  {
    name: 'Dropbox',
    title: 'Dropbox',
    domain: 'dropbox.com',
    breachDate: '2012-07-01',
    addedDate: '2016-08-31T00:00:00Z',
    modifiedDate: '2016-08-31T00:00:00Z',
    pwnCount: 68648009,
    description: 'Cloud storage provider Dropbox suffered a major breach exposing 68 million user accounts. Leaked data included email addresses and salted hashed passwords.',
    logoUrl: 'https://logos.haveibeenpwned.com/Dropbox.png',
    dataClasses: ['Email addresses', 'Passwords'],
    isVerified: true,
    isSensitive: false,
    disclosureUrl: 'https://www.theguardian.com/technology/2016/aug/31/dropbox-hack-passwords-68m-users',
  },
  {
    name: 'LinkedIn',
    title: 'LinkedIn',
    domain: 'linkedin.com',
    breachDate: '2012-05-05',
    addedDate: '2016-05-18T00:00:00Z',
    modifiedDate: '2016-05-18T00:00:00Z',
    pwnCount: 164611595,
    description: 'Professional networking platform LinkedIn suffered a breach of 164 million accounts containing email addresses and password hashes.',
    logoUrl: 'https://logos.haveibeenpwned.com/LinkedIn.png',
    dataClasses: ['Email addresses', 'Passwords'],
    isVerified: true,
    isSensitive: false,
    disclosureUrl: 'https://www.theguardian.com/technology/2016/may/18/linkedin-hack-passwords-email-addresses',
  },
  {
    name: 'Adobe',
    title: 'Adobe Systems',
    domain: 'adobe.com',
    breachDate: '2013-10-04',
    addedDate: '2013-12-04T00:00:00Z',
    modifiedDate: '2013-12-04T00:00:00Z',
    pwnCount: 152445165,
    description: 'Adobe Systems suffered a breach exposing 152 million accounts containing customer information, usernames, and passwords with password hints.',
    logoUrl: 'https://logos.haveibeenpwned.com/Adobe.png',
    dataClasses: ['Credit card data', 'Email addresses', 'Password hints', 'Passwords', 'Usernames'],
    isVerified: true,
    isSensitive: false,
    disclosureUrl: 'https://krebsonsecurity.com/2013/10/adobe-to-announce-source-code-customer-data-breach/',
  },
];

export const BreachService = {
  /**
   * Gets the last breach scan result from storage.
   */
  async getLastScanResult(): Promise<BreachScanResult | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.BREACH_SCAN_RESULT);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Fetches the latest global website and application data breach news from HIBP API.
   * Caches results locally for offline resilience.
   */
  async fetchBreachNews(forceRefresh = false): Promise<BreachNewsItem[]> {
    try {
      if (!forceRefresh) {
        const cachedRaw = await AsyncStorage.getItem(STORAGE_KEYS.BREACH_NEWS_CACHE);
        const cachedTime = await AsyncStorage.getItem(STORAGE_KEYS.BREACH_NEWS_TIMESTAMP);
        if (cachedRaw && cachedTime) {
          const ageHours = (Date.now() - Number(cachedTime)) / (1000 * 60 * 60);
          // Return cached if less than 6 hours old
          if (ageHours < 6) {
            const parsed = JSON.parse(cachedRaw) as BreachNewsItem[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              return await BreachService.checkVaultMatches(parsed);
            }
          }
        }
      }

      // Fetch live from HIBP breaches API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(HIBP_BREACHES_ENDPOINT, {
        headers: {
          'User-Agent': 'PasswordGuardian-MobileApp/1.0',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HIBP API responded with status ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid HIBP API response format');
      }

      const formatted: BreachNewsItem[] = data.map((b: any) => ({
        name: b.Name || '',
        title: b.Title || b.Name || 'Unknown Breach',
        domain: b.Domain || '',
        breachDate: b.BreachDate || '',
        addedDate: b.AddedDate || b.BreachDate || '',
        modifiedDate: b.ModifiedDate || '',
        pwnCount: typeof b.PwnCount === 'number' ? b.PwnCount : 0,
        description: stripHtml(b.Description || ''),
        logoUrl: b.LogoPath || undefined,
        dataClasses: Array.isArray(b.DataClasses) ? b.DataClasses : [],
        isVerified: !!b.IsVerified,
        isSensitive: !!b.IsSensitive,
        disclosureUrl: b.DisclosureUrl || null,
      }));

      // Sort by newest addition date descending
      formatted.sort((a, b) => {
        const timeA = new Date(a.addedDate || a.breachDate).getTime();
        const timeB = new Date(b.addedDate || b.breachDate).getTime();
        return timeB - timeA;
      });

      // Cache raw news
      await AsyncStorage.setItem(STORAGE_KEYS.BREACH_NEWS_CACHE, JSON.stringify(formatted));
      await AsyncStorage.setItem(STORAGE_KEYS.BREACH_NEWS_TIMESTAMP, String(Date.now()));

      return await BreachService.checkVaultMatches(formatted);
    } catch {
      // Fallback: check cached data or fallback list
      try {
        const cachedRaw = await AsyncStorage.getItem(STORAGE_KEYS.BREACH_NEWS_CACHE);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw) as BreachNewsItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return await BreachService.checkVaultMatches(parsed);
          }
        }
      } catch {
        // ignore cache parse errors
      }

      return await BreachService.checkVaultMatches(FALLBACK_BREACH_NEWS);
    }
  },

  /**
   * Annotates breach news items with matching credentials stored in the user's vault.
   */
  async checkVaultMatches(breachNews: BreachNewsItem[]): Promise<BreachNewsItem[]> {
    try {
      const credentials = await VaultService.getCredentials();
      if (!credentials || credentials.length === 0) return breachNews;

      return breachNews.map(item => {
        const itemDomain = item.domain.toLowerCase();
        const itemName = item.name.toLowerCase();
        const itemTitle = item.title.toLowerCase();

        const match = credentials.find(c => {
          const credUrl = c.website ? extractDomain(c.website) : '';
          const credTitle = c.title.trim().toLowerCase();

          if (itemDomain && credUrl && (credUrl.includes(itemDomain) || itemDomain.includes(credUrl))) {
            return true;
          }
          if (itemDomain && credTitle && credTitle.includes(itemDomain.replace(/\.[a-z]+$/, ''))) {
            return true;
          }
          if (credTitle && (credTitle === itemTitle || credTitle.includes(itemName) || itemName.includes(credTitle))) {
            return true;
          }
          return false;
        });

        if (match) {
          return {
            ...item,
            matchedVaultCredentialId: match.id,
            matchedCredentialTitle: match.title,
          };
        }
        return item;
      });
    } catch {
      return breachNews;
    }
  },

  /**
   * Runs a breach scan against the vault credentials using HIBP directory intelligence.
   */
  async scanVault(vaultKey: string): Promise<BreachScanResult> {
    const credentials = await VaultService.getCredentials();
    const results: BreachResult[] = [];
    const now = new Date().toISOString();

    // Fetch breach intelligence
    const breachNews = await BreachService.fetchBreachNews(false);

    for (const cred of credentials) {
      const credDomain = cred.website ? extractDomain(cred.website) : '';
      const credTitle = cred.title.trim().toLowerCase();

      // Find if this account matches any breached company/app
      const matchedBreach = breachNews.find(b => {
        const bDomain = b.domain.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const bName = b.name.toLowerCase();

        if (bDomain && credDomain && (credDomain.includes(bDomain) || bDomain.includes(credDomain))) {
          return true;
        }
        if (bDomain && credTitle && credTitle.includes(bDomain.replace(/\.[a-z]+$/, ''))) {
          return true;
        }
        if (credTitle && (credTitle === bTitle || bTitle.includes(credTitle) || bName.includes(credTitle))) {
          return true;
        }
        return false;
      });

      if (matchedBreach) {
        const exposesPassword = matchedBreach.dataClasses.some(dc =>
          dc.toLowerCase().includes('password')
        );

        results.push({
          id:               `breach-${cred.id}-${matchedBreach.name}`,
          credentialId:     cred.id,
          credentialTitle:  cred.title,
          breachName:       matchedBreach.title,
          breachDate:       matchedBreach.breachDate || null,
          exposedData:      matchedBreach.dataClasses.slice(0, 5),
          severity:         exposesPassword ? 'critical' : matchedBreach.isSensitive ? 'high' : 'medium',
          description:      matchedBreach.description || `This account matches the "${matchedBreach.title}" breach report.`,
          isResolved:       false,
          detectedAt:       now,
        });
      }
    }

    const scanResult: BreachScanResult = {
      scannedAt:         now,
      totalChecked:      credentials.length,
      affectedCount:     results.length,
      safeCount:         credentials.length - results.length,
      results,
      nextScanAvailable: new Date(Date.now() + 3600_000).toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.BREACH_SCAN_RESULT, JSON.stringify(scanResult));
    return scanResult;
  },

  /**
   * Marks a breach result as resolved.
   */
  async markResolved(breachId: string): Promise<void> {
    const scanResult = await BreachService.getLastScanResult();
    if (!scanResult) return;
    const updated = {
      ...scanResult,
      results: scanResult.results.map(r =>
        r.id === breachId ? { ...r, isResolved: true } : r,
      ),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.BREACH_SCAN_RESULT, JSON.stringify(updated));
  },
};

export default BreachService;

