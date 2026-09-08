/**
 * Format currency in Uganda Shillings (UGX)
 * Example: 250000 -> "UGX 250,000"
 */
export function formatUGX(amount: number | null | undefined, compact = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'UGX 0';
  }

  if (compact && Math.abs(amount) >= 1_000_000) {
    return `UGX ${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (compact && Math.abs(amount) >= 1_000) {
    return `UGX ${(amount / 1_000).toFixed(0)}K`;
  }

  return `UGX ${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Format litres
 * Example: 428.5 -> "428.5 L" or "428 L"
 */
export function formatLitres(litres: number | null | undefined): string {
  if (litres === null || litres === undefined || isNaN(litres)) {
    return '0 L';
  }
  const formatted = Number.isInteger(litres)
    ? litres.toLocaleString('en-US')
    : litres.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${formatted} L`;
}

/**
 * Format date in friendly format
 * Example: "2026-09-06" -> "06 Sep 2026"
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format timestamp with time
 * Example: "2026-09-06T10:15:00Z" -> "06 Sep 2026, 10:15"
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Returns today's ISO date string YYYY-MM-DD
 */
export function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format percentage change
 */
export function formatPercentage(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || isNaN(pct)) {
    return 'Not enough data';
  }
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}
