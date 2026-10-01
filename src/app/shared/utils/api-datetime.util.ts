/**
 * Parse datetimes from Laravel APIs. Strings like "2026-10-01 11:25:50" are UTC (app timezone).
 */
export function parseApiDateTime(value: string | null | undefined): Date | null {
  if (value == null || typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(trimmed)) {
    const d = new Date(trimmed.replace(' ', 'T') + 'Z');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatApiDateTimeLocal(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  timeZone?: string
): string {
  const d = parseApiDateTime(value);
  if (!d) {
    return '—';
  }
  const fmt: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options
  };
  if (timeZone) {
    fmt.timeZone = timeZone;
  }
  return d.toLocaleString(undefined, fmt);
}
