type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

type DateParts = {
  year: number;
  month: number;
  day: number;
};

const CUTOFF_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function assertValidNowUtc(nowUtc: Date): void {
  if (!(nowUtc instanceof Date) || Number.isNaN(nowUtc.getTime())) {
    // Keep INVALID_TIMEZONE for compatibility with existing error contracts.
    throw new Error('INVALID_TIMEZONE');
  }
}

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

function toPreviousDate({ year, month, day }: DateParts): DateParts {
  const utcMidnight = new Date(Date.UTC(year, month - 1, day));
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() - 1);
  return {
    year: utcMidnight.getUTCFullYear(),
    month: utcMidnight.getUTCMonth() + 1,
    day: utcMidnight.getUTCDate(),
  };
}

function currentDate(local: LocalDateTimeParts): DateParts {
  return {
    year: local.year,
    month: local.month,
    day: local.day,
  };
}

function resolveBusinessDate(local: LocalDateTimeParts, cutoffMinutes: number): DateParts {
  const localMinutes = local.hour * 60 + local.minute;
  if (localMinutes < cutoffMinutes) {
    return toPreviousDate(currentDate(local));
  }
  return currentDate(local);
}

export function resolveLogDate(nowUtc: Date, timezone: string, cutoffTime: string): string {
  assertValidNowUtc(nowUtc);
  assertValidTimezone(timezone);
  const cutoffMinutes = parseCutoffMinutes(cutoffTime);
  const local = getLocalDateTimeParts(nowUtc, timezone);
  const businessDate = resolveBusinessDate(local, cutoffMinutes);
  return formatYmd(businessDate.year, businessDate.month, businessDate.day);
}
