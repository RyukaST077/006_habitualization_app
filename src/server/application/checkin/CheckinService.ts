import { resolveLogDate } from '../../domain/time/BusinessDateService';
import {
  checkinCancelNotAllowedError,
  domainConflictError,
  forbiddenError,
  habitArchivedError,
  internalError,
  validationError,
} from './CheckinErrors';
import type { CancelCheckinResult, CheckinResult } from './CheckinTypes';

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
  cancelCheckin(
    userId: string,
    habitId: string,
    logDate: string,
  ): Promise<{ deleted: boolean }>;
}

type CheckinContext = {
  logDate: string;
  idempotent: boolean;
};

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
  if (error.message.startsWith('INVALID_TIMEZONE') || error.message.startsWith('INVALID_CUTOFF_TIME')) {
    return validationError('VALIDATION_ERROR:profile_settings');
  }
  if (error.message.startsWith('FORBIDDEN')) {
    return forbiddenError(error.message);
  }
  if (error.message.startsWith('CHECKIN_CANCEL_NOT_ALLOWED')) {
    return checkinCancelNotAllowedError(error.message);
  }
  if (error.message.startsWith('CHECKIN_CONFLICT')) {
    return domainConflictError('DOMAIN_CONFLICT:checkin');
  }
  return internalError('INTERNAL_ERROR:checkin');
}

function asDomainError(error: unknown): Error {
  if (error instanceof Error && error.name === 'CheckinDomainError') {
    if (error.message.startsWith('HABIT_ARCHIVED')) {
      return domainConflictError('DOMAIN_CONFLICT:archived');
    }
    return error;
  }

  if (error instanceof Error) {
    return mapInfrastructureError(error);
  }
  return internalError('INTERNAL_ERROR:checkin');
}

function assertAccessibleHabit(habitStatus: 'active' | 'archived' | null): void {
  if (!habitStatus) {
    // FR-025 / RLS boundary: owner scope by user_id. Reject with FORBIDDEN and keep DB_UNCHANGED.
    throw forbiddenError('FORBIDDEN:habit_owner_mismatch:DB_UNCHANGED:user_id:RLS:FR-025');
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
      throw validationError('VALIDATION_ERROR:checkin_input');
    }

    const profile = await this.userRepository.findProfile(userId);
    if (!profile || profile.accountStatus !== 'active') {
      throw forbiddenError('FORBIDDEN:inactive_profile');
    }

    try {
      const logDate = resolveLogDate(
        nowUtc,
        profile.timezone,
        normalizeCutoffTime(profile.dayCutoffTime),
      );
      const habitStatus = await this.habitRepository.findOwnedHabitStatus(userId, habitId);
      assertAccessibleHabit(habitStatus);
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
      throw validationError('VALIDATION_ERROR:cancel_input');
    }

    const profile = await this.userRepository.findProfile(userId);
    if (!profile || profile.accountStatus !== 'active') {
      throw forbiddenError('FORBIDDEN:inactive_profile');
    }

    try {
      const logDate = resolveLogDate(
        nowUtc,
        profile.timezone,
        normalizeCutoffTime(profile.dayCutoffTime),
      );
      const habitStatus = await this.habitRepository.findOwnedHabitStatus(userId, habitId);
      assertAccessibleHabit(habitStatus);

      const cancelResult = await this.habitRepository.cancelCheckin(userId, habitId, logDate);
      if (!cancelResult.deleted) {
        // BRL-010: only same-day cancel is allowed. Out-of-day requests are rejected.
        throw checkinCancelNotAllowedError(
          'CHECKIN_CANCEL_NOT_ALLOWED:out_of_day:DB_UNCHANGED:CHECKIN_CANCEL:failure',
        );
      }

      return {
        logDate,
        canceled: true,
        auditAction: 'CHECKIN_CANCEL',
      };
    } catch (error) {
      throw asDomainError(error);
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
