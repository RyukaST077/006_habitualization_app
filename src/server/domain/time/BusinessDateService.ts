const HH_MM_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

class BusinessDateServiceError extends Error {
  code: "INVALID_TIMEZONE" | "INVALID_CUTOFF_TIME";

  constructor(code: "INVALID_TIMEZONE" | "INVALID_CUTOFF_TIME", message: string) {
    super(message);
    this.name = "BusinessDateServiceError";
    this.code = code;
  }
}

const validateTimezone = (timezone: string): void => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
  } catch {
    throw new BusinessDateServiceError("INVALID_TIMEZONE", `Invalid timezone: ${timezone}`);
  }
};

const parseCutoffMinutes = (cutoffTime: string): number => {
  if (!HH_MM_PATTERN.test(cutoffTime)) {
    throw new BusinessDateServiceError("INVALID_CUTOFF_TIME", `Invalid cutoff time: ${cutoffTime}`);
  }

  const [hours, minutes] = cutoffTime.split(":").map((value) => Number(value));
  return hours * 60 + minutes;
};

const toLocalDateTimeParts = (nowUtc: string, timezone: string): LocalDateTimeParts => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(nowUtc));
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const token = parts.find((part) => part.type === type);
    return Number(token?.value);
  };

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
};

const toTotalMinutes = (hour: number, minute: number): number => hour * 60 + minute;

const toYmd = (year: number, month: number, day: number): string => {
  const yyyy = String(year).padStart(4, "0");
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const shiftDate = (year: number, month: number, day: number, diffDays: number): string => {
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + diffDays);
  return toYmd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
};

const resolveDateShiftDays = (localMinutes: number, cutoffMinutes: number): 0 | -1 =>
  localMinutes < cutoffMinutes ? -1 : 0;

const resolveDateFromLocal = (local: LocalDateTimeParts, cutoffMinutes: number): string => {
  const localMinutes = toTotalMinutes(local.hour, local.minute);
  const shiftDays = resolveDateShiftDays(localMinutes, cutoffMinutes);
  if (shiftDays === -1) {
    return shiftDate(local.year, local.month, local.day, shiftDays);
  }

  return toYmd(local.year, local.month, local.day);
};

const buildResolveContext = (
  nowUtc: string,
  timezone: string,
  cutoffTime: string,
): { local: LocalDateTimeParts; cutoffMinutes: number } => {
  validateTimezone(timezone);
  const cutoffMinutes = parseCutoffMinutes(cutoffTime);
  const local = toLocalDateTimeParts(nowUtc, timezone);
  return { local, cutoffMinutes };
};

export function resolveLogDate(nowUtc: string, timezone: string, cutoffTime: string): string {
  const { local, cutoffMinutes } = buildResolveContext(nowUtc, timezone, cutoffTime);
  return resolveDateFromLocal(local, cutoffMinutes);
}

export default {
  resolveLogDate,
};
