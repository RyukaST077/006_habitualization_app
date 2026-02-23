export interface If002ValidationError {
  message: string;
  requirement_id: string;
}

type ValidationResult = If002ValidationError | null;

const NAME_MIN = 1;
const NAME_MAX = 80;
const DISPLAY_ORDER_MIN = 1;
const DISPLAY_ORDER_MAX = 9999;
const HH_MM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidIanaTimeZone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function validateName(name: unknown, required: boolean): ValidationResult {
  if (name === undefined) {
    return required ? { message: "name is required", requirement_id: "FR-011" } : null;
  }

  if (typeof name !== "string" || name.length < NAME_MIN || name.length > NAME_MAX) {
    return { message: "name must be 1..80 characters", requirement_id: "FR-011" };
  }

  return null;
}

function validateDisplayOrder(displayOrder: unknown): ValidationResult {
  if (!Number.isInteger(displayOrder)) {
    return { message: "display_order must be 1..9999", requirement_id: "FR-011" };
  }

  const value = displayOrder as number;
  if (value < DISPLAY_ORDER_MIN || value > DISPLAY_ORDER_MAX) {
    return { message: "display_order must be 1..9999", requirement_id: "FR-011" };
  }

  return null;
}

export function validateHabitCreateDto(payload: unknown): ValidationResult {
  if (!isObjectRecord(payload)) {
    return { message: "name is required", requirement_id: "FR-011" };
  }

  const nameError = validateName(payload.name, true);
  if (nameError) {
    return nameError;
  }

  return validateDisplayOrder(payload.display_order);
}

export function validateHabitUpdateDto(payload: unknown): ValidationResult {
  if (!isObjectRecord(payload)) {
    return { message: "name must be 1..80 characters", requirement_id: "FR-011" };
  }

  if ("name" in payload) {
    const nameError = validateName(payload.name, false);
    if (nameError) {
      return nameError;
    }
  }

  if ("display_order" in payload) {
    const displayOrderError = validateDisplayOrder(payload.display_order);
    if (displayOrderError) {
      return displayOrderError;
    }
  }

  return null;
}

export function validateProfileSettingsDto(payload: unknown): ValidationResult {
  if (!isObjectRecord(payload)) {
    return { message: "timezone is invalid", requirement_id: "FR-021" };
  }

  const timezone = payload.timezone;
  if (typeof timezone !== "string" || !isValidIanaTimeZone(timezone)) {
    return { message: "timezone is invalid", requirement_id: "FR-021" };
  }

  const dayCutoffTime = payload.day_cutoff_time;
  if (typeof dayCutoffTime !== "string" || !HH_MM_PATTERN.test(dayCutoffTime)) {
    return { message: "day_cutoff_time must be hh:mm", requirement_id: "FR-021" };
  }

  return null;
}
