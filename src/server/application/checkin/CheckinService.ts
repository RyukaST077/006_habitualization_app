import { resolveLogDate } from '../../domain/time/BusinessDateService';
import {
  checkinCancelNotAllowedError,
  domainConflictError,
  forbiddenError,
  habitArchivedError,
  internalError,
  isCheckinDomainError,
  validationError,
} from './CheckinErrors';
import {
  CHECKIN_AUDIT_ACTION,
  type CancelCheckinResult,
  type CheckinResult,
} from './CheckinTypes';

type Profile = {
  timezone: string;
  dayCutoffTime: string;
  accountStatus: 'active' | 'disabled' | 'deleted';
};

export interface CheckinUserRepositoryPort {
  findProfile(userId: string): Promise<Profile | null>;
  incrementDailyActivity(delta: {
    userId: string;
    logDate: string;
    loginDelta: number;
    checkinDelta: number;
  }): Promise<void>;
}

export interface CheckinHabitRepositoryPort {
  findOwnedHabitStatus(userId: string, habitId: string): Promise<'active' | 'archived' | null>;
  upsertCheckin(
    userId: string,
    habitId: string,
    logDate: string,
    checkedInAt: string,
  ): Promise<{ idempotent: boolean }>;
  cancelTodayCheckin(
    userId: string,
    habitId: string,
    logDate: string,
  ): Promise<{ deleted: boolean }>;
}

type CheckinContext = {
  logDate: string;
  idempotent: boolean;
};

const ERROR_PREFIX = {
  INVALID_TIMEZONE: 'INVALID_TIMEZONE',
  INVALID_CUTOFF_TIME: 'INVALID_CUTOFF_TIME',
  FORBIDDEN: 'FORBIDDEN',
  CHECKIN_CANCEL_NOT_ALLOWED: 'CHECKIN_CANCEL_NOT_ALLOWED',
  CHECKIN_CONFLICT: 'CHECKIN_CONFLICT',
  HABIT_ARCHIVED: 'HABIT_ARCHIVED',
} as const;

const ERROR_MESSAGE = {
  PROFILE_SETTINGS: 'VALIDATION_ERROR:profile_settings',
  CHECKIN_INTERNAL: 'INTERNAL_ERROR:checkin',
  CHECKIN_CONFLICT: 'DOMAIN_CONFLICT:checkin',
  HABIT_ARCHIVED: 'DOMAIN_CONFLICT:archived',
  ACTIVE_PROFILE: 'FORBIDDEN:inactive_profile',
  CHECKIN_INPUT: 'VALIDATION_ERROR:checkin_input',
  CANCEL_INPUT: 'VALIDATION_ERROR:cancel_input',
  // FR-025 / RLS boundary: owner scope by user_id. Keep DB_UNCHANGED semantics.
  OWNER_SCOPE_VIOLATION: 'FORBIDDEN:habit_owner_mismatch:DB_UNCHANGED:user_id:RLS:FR-025',
  // FR-014 boundary: cancel is allowed only for the same business day check-in.
  OUT_OF_DAY_CANCEL: 'CHECKIN_CANCEL_NOT_ALLOWED:out_of_day:DB_UNCHANGED:CHECKIN_CANCEL:failure',
} as const;

function normalizeCutoffTime(value: string): string {
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5);
  }
  throw validationError('VALIDATION_ERROR:dayCutoffTime');
}

function mapInfrastructureError(error: Error): Error {
  if (
    error.message.startsWith(ERROR_PREFIX.INVALID_TIMEZONE)
    || error.message.startsWith(ERROR_PREFIX.INVALID_CUTOFF_TIME)
  ) {
    return validationError(ERROR_MESSAGE.PROFILE_SETTINGS);
  }
  if (error.message.startsWith(ERROR_PREFIX.FORBIDDEN)) {
    return forbiddenError(error.message);
  }
  if (error.message.startsWith(ERROR_PREFIX.CHECKIN_CANCEL_NOT_ALLOWED)) {
    return checkinCancelNotAllowedError(error.message);
  }
  if (error.message.startsWith(ERROR_PREFIX.CHECKIN_CONFLICT)) {
    return domainConflictError(ERROR_MESSAGE.CHECKIN_CONFLICT);
  }
  return internalError(ERROR_MESSAGE.CHECKIN_INTERNAL);
}

function asDomainError(error: unknown): Error {
  if (isCheckinDomainError(error)) {
    if (error.message.startsWith(ERROR_PREFIX.HABIT_ARCHIVED)) {
      return domainConflictError(ERROR_MESSAGE.HABIT_ARCHIVED);
    }
    return error;
  }

  if (error instanceof Error) {
    return mapInfrastructureError(error);
  }
  return internalError(ERROR_MESSAGE.CHECKIN_INTERNAL);
}

function assertAccessibleHabit(habitStatus: 'active' | 'archived' | null): void {
  if (!habitStatus) {
    throw forbiddenError(ERROR_MESSAGE.OWNER_SCOPE_VIOLATION);
  }
  if (habitStatus === 'archived') {
    throw habitArchivedError('HABIT_ARCHIVED:DOMAIN_CONFLICT:archived');
  }
}

export class CheckinService {
  constructor(
    private readonly userRepository: CheckinUserRepositoryPort,
    private readonly habitRepository: CheckinHabitRepositoryPort,
  ) {}

  async registerCheckin(userId: string, habitId: string, nowUtc: Date): Promise<CheckinResult> {
    if (!userId || !habitId) {
      throw validationError(ERROR_MESSAGE.CHECKIN_INPUT);
    }

    const profile = await this.loadActiveProfile(userId);

    try {
      const logDate = this.resolveBusinessLogDate(profile, nowUtc);
      await this.assertActiveOwnedHabit(userId, habitId);
      const context = await this.persistCheckinAndBuildContext(userId, habitId, logDate, nowUtc);
      await this.userRepository.incrementDailyActivity({
        userId,
        logDate: context.logDate,
        loginDelta: 0,
        checkinDelta: context.idempotent ? 0 : 1,
      });

      return {
        logDate: context.logDate,
        idempotent: context.idempotent,
      };
    } catch (error) {
      throw asDomainError(error);
    }
  }

  async cancelTodayCheckin(userId: string, habitId: string, nowUtc: Date): Promise<CancelCheckinResult> {
    if (!userId || !habitId) {
      throw validationError(ERROR_MESSAGE.CANCEL_INPUT);
    }

    const profile = await this.loadActiveProfile(userId);

    try {
      const logDate = this.resolveBusinessLogDate(profile, nowUtc);
      await this.assertActiveOwnedHabit(userId, habitId);

      const cancelResult = await this.habitRepository.cancelTodayCheckin(userId, habitId, logDate);
      this.assertCancelableResult(cancelResult);

      return {
        logDate,
        canceled: true,
        auditAction: CHECKIN_AUDIT_ACTION.CANCEL,
      };
    } catch (error) {
      throw asDomainError(error);
    }
  }

  private async loadActiveProfile(userId: string): Promise<Profile> {
    const profile = await this.userRepository.findProfile(userId);
    if (!profile || profile.accountStatus !== 'active') {
      throw forbiddenError(ERROR_MESSAGE.ACTIVE_PROFILE);
    }
    return profile;
  }

  private resolveBusinessLogDate(profile: Profile, nowUtc: Date): string {
    return resolveLogDate(
      nowUtc,
      profile.timezone,
      normalizeCutoffTime(profile.dayCutoffTime),
    );
  }

  private async assertActiveOwnedHabit(userId: string, habitId: string): Promise<void> {
    const habitStatus = await this.habitRepository.findOwnedHabitStatus(userId, habitId);
    assertAccessibleHabit(habitStatus);
  }

  private assertCancelableResult(cancelResult: { deleted: boolean }): void {
    if (!cancelResult.deleted) {
      throw checkinCancelNotAllowedError(ERROR_MESSAGE.OUT_OF_DAY_CANCEL);
    }
  }

  private async persistCheckinAndBuildContext(
    userId: string,
    habitId: string,
    logDate: string,
    nowUtc: Date,
  ): Promise<CheckinContext> {
    const upsertResult = await this.habitRepository.upsertCheckin(
      userId,
      habitId,
      logDate,
      nowUtc.toISOString(),
    );
    return {
      logDate,
      idempotent: upsertResult.idempotent === true,
    };
  }
}
