/**
 * Returns a human-readable relative time string.
 * e.g. "2 days ago", "just now", "3 months ago"
 */
export function timeAgo(isoString: string | null): string {
  if (!isoString) return 'Never';
  const now  = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return 'Just now';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  const months  = Math.floor(days / 30);
  const years   = Math.floor(days / 365);

  if (seconds < 60)   return 'Just now';
  if (minutes < 60)   return `${minutes}m ago`;
  if (hours < 24)     return `${hours}h ago`;
  if (days < 7)       return `${days}d ago`;
  if (days < 30)      return `${Math.floor(days / 7)}w ago`;
  if (months < 12)    return `${months}mo ago`;
  return `${years}y ago`;
}

/**
 * Returns a short formatted date: "Sep 17, 2026"
 */
export function formatDate(isoString: string | null): string {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/**
 * Returns a full formatted date+time: "Sep 17, 2026 at 5:02 PM"
 */
export function formatDateTime(isoString: string | null): string {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

/**
 * Extracts a domain from a URL: "https://github.com/user" → "github.com"
 */
export function extractDomain(url: string): string {
  if (!url) return '';
  try {
    const u = url.startsWith('http') ? new URL(url) : new URL(`https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url.split('/')[0].replace(/^www\./, '');
  }
}

/**
 * Returns the favicon URL for a given domain.
 * Uses Google's CDN — only domain is sent, never credentials.
 */
export function faviconUrl(domain: string, size = 64): string {
  const clean = extractDomain(domain) || domain;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean)}&sz=${size}`;
}

/**
 * Masks a password for display: "••••••••" with length count.
 */
export function maskPassword(password: string): string {
  return '•'.repeat(Math.min(password.length, 20));
}

/**
 * Formats bytes to a human-readable string: "1.2 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Returns a greeting based on the current hour.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

/**
 * Truncates a string with ellipsis if longer than maxLen.
 */
export function truncate(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}
