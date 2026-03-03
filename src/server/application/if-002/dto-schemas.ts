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
const POLICY_TYPE_SET = new Set(["terms", "privacy"]);
const POLICY_VERSION_PATTERN = /^v\d+\.\d+(?:\.\d+)?$/;
const POLICY_VERSION_MAX_LENGTH = 20;
const CONSENT_REQUIREMENT_ID = "FR-005";
const HABIT_CREATE_REQUIREMENT_ID = "FR-006";
const HABIT_UPDATE_REQUIREMENT_ID = "FR-007";
const CHECKIN_REGISTER_REQUIREMENT_ID = "FR-011";
const CHECKIN_IDEMPOTENT_REQUIREMENT_ID = "FR-012";
const YYYY_MM_DD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

function validateName(name: unknown, required: boolean, requirementId: string): ValidationResult {
  if (name === undefined) {
    return required ? { message: "name is required", requirement_id: requirementId } : null;
  }

  if (typeof name !== "string" || name.length < NAME_MIN || name.length > NAME_MAX) {
    return { message: "name must be 1..80 characters", requirement_id: requirementId };
  }

  return null;
}

function validateDisplayOrder(displayOrder: unknown, requirementId: string): ValidationResult {
  if (!Number.isInteger(displayOrder)) {
    return { message: "display_order must be 1..9999", requirement_id: requirementId };
  }

  const value = displayOrder as number;
  if (value < DISPLAY_ORDER_MIN || value > DISPLAY_ORDER_MAX) {
    return { message: "display_order must be 1..9999", requirement_id: requirementId };
  }

  return null;
}

export function validateHabitCreateDto(payload: unknown): ValidationResult {
  if (!isObjectRecord(payload)) {
    return { message: "name is required", requirement_id: HABIT_CREATE_REQUIREMENT_ID };
  }

  const nameError = validateName(payload.name, true, HABIT_CREATE_REQUIREMENT_ID);
  if (nameError) {
    return nameError;
  }

  return validateDisplayOrder(payload.display_order, HABIT_CREATE_REQUIREMENT_ID);
}

export function validateHabitUpdateDto(payload: unknown): ValidationResult {
  if (!isObjectRecord(payload)) {
    return { message: "name must be 1..80 characters", requirement_id: HABIT_UPDATE_REQUIREMENT_ID };
  }

  if ("name" in payload) {
    const nameError = validateName(payload.name, false, HABIT_UPDATE_REQUIREMENT_ID);
    if (nameError) {
      return nameError;
    }
  }

  if ("display_order" in payload) {
    const displayOrderError = validateDisplayOrder(payload.display_order, HABIT_UPDATE_REQUIREMENT_ID);
    if (displayOrderError) {
      return displayOrderError;
    }
  }

  return null;
}

export function validateCheckinDto(payload: unknown): ValidationResult {
  if (!isObjectRecord(payload)) {
    return { message: "habit_id is required", requirement_id: CHECKIN_REGISTER_REQUIREMENT_ID };
  }

  if (typeof payload.habit_id !== "string" || payload.habit_id.length === 0) {
    return { message: "habit_id is required", requirement_id: CHECKIN_REGISTER_REQUIREMENT_ID };
  }

  if (typeof payload.log_date !== "string" || !YYYY_MM_DD_PATTERN.test(payload.log_date)) {
    return { message: "log_date must be yyyy-mm-dd", requirement_id: CHECKIN_IDEMPOTENT_REQUIREMENT_ID };
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

export function validatePolicyConsentsDto(payload: unknown): ValidationResult {
  if (!isObjectRecord(payload)) {
    return { message: "consents is required", requirement_id: CONSENT_REQUIREMENT_ID };
  }

  const consents = payload.consents;
  if (!Array.isArray(consents) || consents.length === 0) {
    return { message: "consents must be a non-empty array", requirement_id: CONSENT_REQUIREMENT_ID };
  }

  const seenPolicyTypes = new Set<string>();

  for (let index = 0; index < consents.length; index += 1) {
    const consent = consents[index];

    if (!isObjectRecord(consent)) {
      return { message: `consents[${index}] must be an object`, requirement_id: CONSENT_REQUIREMENT_ID };
    }

    const policyType = consent.policy_type;
    if (typeof policyType !== "string" || !POLICY_TYPE_SET.has(policyType)) {
      return {
        message: `consents[${index}].policy_type must be terms|privacy`,
        requirement_id: CONSENT_REQUIREMENT_ID,
      };
    }

    const policyVersion = consent.policy_version;
    if (
      typeof policyVersion !== "string"
      || policyVersion.length === 0
      || policyVersion.length > POLICY_VERSION_MAX_LENGTH
      || !POLICY_VERSION_PATTERN.test(policyVersion)
    ) {
      return {
        message: `consents[${index}].policy_version must match v<major>.<minor>[.<patch>]`,
        requirement_id: CONSENT_REQUIREMENT_ID,
      };
    }

    if (seenPolicyTypes.has(policyType)) {
      return {
        message: "duplicate consent for policy_type is not allowed",
        requirement_id: CONSENT_REQUIREMENT_ID,
      };
    }

    seenPolicyTypes.add(policyType);
  }

  return null;
}
