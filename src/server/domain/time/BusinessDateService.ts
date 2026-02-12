type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const CUTOFF_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function assertValidTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
  } catch {
    throw new Error('INVALID_TIMEZONE');
  }
}

function parseCutoffMinutes(cutoffTime: string): number {
  const matched = CUTOFF_PATTERN.exec(cutoffTime);
  if (!matched) {
    throw new Error('INVALID_CUTOFF_TIME');
  }

  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  return hour * 60 + minute;
}

function getLocalDateTimeParts(nowUtc: Date, timezone: string): LocalDateTimeParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(nowUtc);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((item) => item.type === type)?.value;
    return Number(part);
  };

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
  };
}

function formatYmd(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function previousDate(year: number, month: number, day: number): { year: number; month: number; day: number } {
  const utcMidnight = new Date(Date.UTC(year, month - 1, day));
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() - 1);
  return {
    year: utcMidnight.getUTCFullYear(),
    month: utcMidnight.getUTCMonth() + 1,
    day: utcMidnight.getUTCDate(),
  };
}

export function resolveLogDate(nowUtc: Date, timezone: string, cutoffTime: string): string {
  if (!(nowUtc instanceof Date) || Number.isNaN(nowUtc.getTime())) {
    throw new Error('INVALID_TIMEZONE');
  }

  assertValidTimezone(timezone);
  const cutoffMinutes = parseCutoffMinutes(cutoffTime);
  const local = getLocalDateTimeParts(nowUtc, timezone);
  const localMinutes = local.hour * 60 + local.minute;

  if (localMinutes < cutoffMinutes) {
    const prev = previousDate(local.year, local.month, local.day);
    return formatYmd(prev.year, prev.month, prev.day);
  }

  return formatYmd(local.year, local.month, local.day);
}
