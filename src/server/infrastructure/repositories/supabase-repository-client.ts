import type {
  AccountDeletionJob,
  AuditLogRecord,
  DailyKpiRow,
  Habit,
  HabitLog,
  MonitoringAlertEvent,
  PolicyType,
  PolicyVersion,
  PolicySetting,
  Profile,
  UserDailyActivity,
  UserPolicyConsent,
} from "../../domain/repositories/types";
import { createRepositoryError } from "../../domain/repositories/errors";

export interface SupabaseRepositorySeedData {
  profiles?: Profile[];
  habits?: Habit[];
  habitLogs?: HabitLog[];
  userDailyActivities?: UserDailyActivity[];
  policySettings?: PolicySetting[];
  policyConsents?: UserPolicyConsent[];
  auditLogs?: AuditLogRecord[];
  dailyKpis?: DailyKpiRow[];
  deletionJobs?: AccountDeletionJob[];
  monitoringAlertEvents?: MonitoringAlertEvent[];
}

export interface SupabaseRepositoryClient {
  profiles: Map<string, Profile>;
  habits: Map<string, Habit>;
  habitLogs: Map<string, HabitLog>;
  userDailyActivities: Map<string, UserDailyActivity>;
  policySettings: Map<string, PolicySetting>;
  policyConsents: Map<string, UserPolicyConsent>;
  auditLogs: Map<string, AuditLogRecord>;
  dailyKpis: Map<string, DailyKpiRow>;
  deletionJobs: Map<string, AccountDeletionJob>;
  monitoringAlertEvents: Map<string, MonitoringAlertEvent>;
  nextHabitId(): string;
  nextAuditLogId(): string;
  nextAuditOccurredAt(fallbackIso: string): string;
  nextDeletionJobId(): string;
  nextMonitoringAlertEventId(): string;
  now(): string;
  withTransaction<T>(action: (client: SupabaseRepositoryClient) => Promise<T> | T): Promise<T>;
}

interface MutableState {
  habitSequence: number;
  auditLogSequence: number;
  latestAuditLogMs: number | null;
  deletionJobSequence: number;
  alertEventSequence: number;
}

interface MutableMaps {
  profiles: Map<string, Profile>;
  habits: Map<string, Habit>;
  habitLogs: Map<string, HabitLog>;
  userDailyActivities: Map<string, UserDailyActivity>;
  policySettings: Map<string, PolicySetting>;
  policyConsents: Map<string, UserPolicyConsent>;
  auditLogs: Map<string, AuditLogRecord>;
  dailyKpis: Map<string, DailyKpiRow>;
  deletionJobs: Map<string, AccountDeletionJob>;
  monitoringAlertEvents: Map<string, MonitoringAlertEvent>;
}

function cloneProfile(profile: Profile): Profile {
  return { ...profile };
}

function cloneHabit(habit: Habit): Habit {
  return { ...habit };
}

function cloneHabitLog(log: HabitLog): HabitLog {
  return { ...log };
}

function cloneUserDailyActivity(activity: UserDailyActivity): UserDailyActivity {
  return { ...activity };
}

function clonePolicySetting(setting: PolicySetting): PolicySetting {
  return { ...setting };
}

function clonePolicyConsent(consent: UserPolicyConsent): UserPolicyConsent {
  return { ...consent };
}

function cloneAuditLog(record: AuditLogRecord): AuditLogRecord {
  return { ...record };
}

function cloneDailyKpi(row: DailyKpiRow): DailyKpiRow {
  return { ...row };
}

function cloneDeletionJob(job: AccountDeletionJob): AccountDeletionJob {
  return { ...job };
}

function cloneMonitoringAlertEvent(event: MonitoringAlertEvent): MonitoringAlertEvent {
  return { ...event };
}

function cloneMapEntries<K, V>(source: Map<K, V>, cloneValue: (value: V) => V): Map<K, V> {
  const copied = new Map<K, V>();
  for (const [key, value] of source.entries()) {
    copied.set(key, cloneValue(value));
  }
  return copied;
}

function cloneMutableMaps(maps: MutableMaps): MutableMaps {
  return {
    profiles: cloneMapEntries(maps.profiles, cloneProfile),
    habits: cloneMapEntries(maps.habits, cloneHabit),
    habitLogs: cloneMapEntries(maps.habitLogs, cloneHabitLog),
    userDailyActivities: cloneMapEntries(maps.userDailyActivities, cloneUserDailyActivity),
    policySettings: cloneMapEntries(maps.policySettings, clonePolicySetting),
    policyConsents: cloneMapEntries(maps.policyConsents, clonePolicyConsent),
    auditLogs: cloneMapEntries(maps.auditLogs, cloneAuditLog),
    dailyKpis: cloneMapEntries(maps.dailyKpis, cloneDailyKpi),
    deletionJobs: cloneMapEntries(maps.deletionJobs, cloneDeletionJob),
    monitoringAlertEvents: cloneMapEntries(maps.monitoringAlertEvents, cloneMonitoringAlertEvent),
  };
}

function replaceMapEntries<K, V>(target: Map<K, V>, source: Map<K, V>): void {
  target.clear();
  for (const [key, value] of source.entries()) {
    target.set(key, value);
  }
}

function applyMutableMaps(target: MutableMaps, source: MutableMaps): void {
  replaceMapEntries(target.profiles, source.profiles);
  replaceMapEntries(target.habits, source.habits);
  replaceMapEntries(target.habitLogs, source.habitLogs);
  replaceMapEntries(target.userDailyActivities, source.userDailyActivities);
  replaceMapEntries(target.policySettings, source.policySettings);
  replaceMapEntries(target.policyConsents, source.policyConsents);
  replaceMapEntries(target.auditLogs, source.auditLogs);
  replaceMapEntries(target.dailyKpis, source.dailyKpis);
  replaceMapEntries(target.deletionJobs, source.deletionJobs);
  replaceMapEntries(target.monitoringAlertEvents, source.monitoringAlertEvents);
}

interface TransactionConflictBaseline {
  profileVersions: Map<string, number>;
  habitLogKeys: Set<string>;
  policyConsentKeys: Set<string>;
}

function buildTransactionConflictBaseline(maps: MutableMaps): TransactionConflictBaseline {
  const profileVersions = new Map<string, number>();
  for (const [userId, profile] of maps.profiles.entries()) {
    profileVersions.set(userId, profile.version);
  }

  return {
    profileVersions,
    habitLogKeys: new Set(maps.habitLogs.keys()),
    policyConsentKeys: new Set(maps.policyConsents.keys()),
  };
}

function detectProfileOptimisticLockConflict(
  baselineProfileVersions: Map<string, number>,
  transactional: Map<string, Profile>,
  current: Map<string, Profile>,
): void {
  for (const [userId, nextProfile] of transactional.entries()) {
    const baselineVersion = baselineProfileVersions.get(userId);
    if (baselineVersion === undefined) {
      continue;
    }
    if (nextProfile.version === baselineVersion) {
      continue;
    }

    const currentProfile = current.get(userId);
    if (currentProfile === undefined || currentProfile.version !== baselineVersion) {
      throw createRepositoryError("OPTIMISTIC_LOCK_CONFLICT", "profile version conflict");
    }
  }
}

function detectInsertedKeyConflict<K, V>(
  baselineKeys: Set<K>,
  transactional: Map<K, V>,
  current: Map<K, V>,
  errorCode: "CHECKIN_CONFLICT" | "UNIQUE_CONFLICT",
  message: string,
): void {
  for (const key of transactional.keys()) {
    if (baselineKeys.has(key)) {
      continue;
    }
    if (current.has(key)) {
      throw createRepositoryError(errorCode, message);
    }
  }
}

function detectTransactionConflicts(
  baseline: TransactionConflictBaseline,
  transactionalMaps: MutableMaps,
  currentMaps: MutableMaps,
): void {
  detectProfileOptimisticLockConflict(baseline.profileVersions, transactionalMaps.profiles, currentMaps.profiles);
  detectInsertedKeyConflict(
    baseline.habitLogKeys,
    transactionalMaps.habitLogs,
    currentMaps.habitLogs,
    "CHECKIN_CONFLICT",
    "duplicate habit/date checkin",
  );
  detectInsertedKeyConflict(
    baseline.policyConsentKeys,
    transactionalMaps.policyConsents,
    currentMaps.policyConsents,
    "UNIQUE_CONFLICT",
    "duplicate policy consent",
  );
}

function buildHabitLogKey(habitId: string, logDate: string): string {
  return `${habitId}:${logDate}`;
}

function buildActivityKey(userId: string, logDate: string): string {
  return `${userId}:${logDate}`;
}

function buildConsentKey(userId: string, policyType: PolicyType, policyVersion: PolicyVersion): string {
  return `${userId}:${policyType}:${policyVersion}`;
}

function buildDailyKpiKey(kpiDate: string, metricName: string): string {
  return `${kpiDate}:${metricName}`;
}

export function buildForbiddenError(message: string): Error & { status: 403; code: "FORBIDDEN" } {
  const error = new Error(message) as Error & { status: 403; code: "FORBIDDEN" };
  error.name = "RepositoryForbiddenError";
  error.status = 403;
  error.code = "FORBIDDEN";
  return error;
}

export function cloneRepositoryValue<T extends object>(value: T): T {
  return { ...value };
}

export function cloneAuditLogForRepository(record: AuditLogRecord): AuditLogRecord {
  return {
    ...record,
    metadata: { ...record.metadata },
    detail: { ...record.detail },
  };
}

export function assertRepositoryOwnership(ownerUserId: string, actorUserId: string, message: string): void {
  if (ownerUserId !== actorUserId) {
    const normalizedMessage = message.includes("RLS") ? message : `RLS policy denied: ${message}`;
    throw buildForbiddenError(normalizedMessage);
  }
}

export function isServiceRoleActor(actor: string): boolean {
  return actor.includes("service_role");
}

export function buildHabitLogKeyForRepository(habitId: string, logDate: string): string {
  return buildHabitLogKey(habitId, logDate);
}

export function buildActivityKeyForRepository(userId: string, logDate: string): string {
  return buildActivityKey(userId, logDate);
}

export function buildConsentKeyForRepository(
  userId: string,
  policyType: PolicyType,
  policyVersion: PolicyVersion,
): string {
  return buildConsentKey(userId, policyType, policyVersion);
}

export function buildDailyKpiKeyForRepository(kpiDate: string, metricName: string): string {
  return buildDailyKpiKey(kpiDate, metricName);
}

export function createSupabaseRepositoryClient(seed: SupabaseRepositorySeedData = {}): SupabaseRepositoryClient {
  const profiles = new Map<string, Profile>();
  const habits = new Map<string, Habit>();
  const habitLogs = new Map<string, HabitLog>();
  const userDailyActivities = new Map<string, UserDailyActivity>();
  const policySettings = new Map<string, PolicySetting>();
  const policyConsents = new Map<string, UserPolicyConsent>();
  const auditLogs = new Map<string, AuditLogRecord>();
  const dailyKpis = new Map<string, DailyKpiRow>();
  const deletionJobs = new Map<string, AccountDeletionJob>();
  const monitoringAlertEvents = new Map<string, MonitoringAlertEvent>();
  const state: MutableState = {
    habitSequence: 0,
    auditLogSequence: 0,
    latestAuditLogMs: null,
    deletionJobSequence: 0,
    alertEventSequence: 0,
  };

  for (const profile of seed.profiles ?? []) {
    profiles.set(profile.userId, cloneProfile(profile));
  }

  for (const habit of seed.habits ?? []) {
    habits.set(habit.habitId, cloneHabit(habit));
    const parsedHabitId = Number.parseInt(habit.habitId, 10);
    if (Number.isFinite(parsedHabitId)) {
      state.habitSequence = Math.max(state.habitSequence, parsedHabitId);
    }
  }

  for (const log of seed.habitLogs ?? []) {
    habitLogs.set(buildHabitLogKey(log.habitId, log.logDate), cloneHabitLog(log));
  }

  for (const activity of seed.userDailyActivities ?? []) {
    userDailyActivities.set(
      buildActivityKey(activity.userId, activity.activityDate),
      cloneUserDailyActivity(activity),
    );
  }

  for (const setting of seed.policySettings ?? []) {
    policySettings.set(setting.policyType, clonePolicySetting(setting));
  }

  for (const consent of seed.policyConsents ?? []) {
    policyConsents.set(
      buildConsentKey(consent.userId, consent.policyType, consent.policyVersion),
      clonePolicyConsent(consent),
    );
  }

  for (const record of seed.auditLogs ?? []) {
    auditLogs.set(record.id, cloneAuditLog(record));
    const parsedId = Number.parseInt(record.id, 10);
    if (Number.isFinite(parsedId)) {
      state.auditLogSequence = Math.max(state.auditLogSequence, parsedId);
    }
    const createdAtMs = Date.parse(record.createdAt);
    if (!Number.isNaN(createdAtMs)) {
      state.latestAuditLogMs = Math.max(state.latestAuditLogMs ?? Number.NEGATIVE_INFINITY, createdAtMs);
    }
  }

  for (const row of seed.dailyKpis ?? []) {
    dailyKpis.set(buildDailyKpiKey(row.kpiDate, row.metricName), cloneDailyKpi(row));
  }

  for (const job of seed.deletionJobs ?? []) {
    deletionJobs.set(job.jobId, cloneDeletionJob(job));
    const parsedId = Number.parseInt(job.jobId, 10);
    if (Number.isFinite(parsedId)) {
      state.deletionJobSequence = Math.max(state.deletionJobSequence, parsedId);
    }
  }

  for (const event of seed.monitoringAlertEvents ?? []) {
    monitoringAlertEvents.set(event.eventId, cloneMonitoringAlertEvent(event));
    const parsedId = Number.parseInt(event.eventId, 10);
    if (Number.isFinite(parsedId)) {
      state.alertEventSequence = Math.max(state.alertEventSequence, parsedId);
    }
  }

  const maps: MutableMaps = {
    profiles,
    habits,
    habitLogs,
    userDailyActivities,
    policySettings,
    policyConsents,
    auditLogs,
    dailyKpis,
    deletionJobs,
    monitoringAlertEvents,
  };

  const buildClient = (targetMaps: MutableMaps, targetState: MutableState): SupabaseRepositoryClient => ({
    profiles: targetMaps.profiles,
    habits: targetMaps.habits,
    habitLogs: targetMaps.habitLogs,
    userDailyActivities: targetMaps.userDailyActivities,
    policySettings: targetMaps.policySettings,
    policyConsents: targetMaps.policyConsents,
    auditLogs: targetMaps.auditLogs,
    dailyKpis: targetMaps.dailyKpis,
    deletionJobs: targetMaps.deletionJobs,
    monitoringAlertEvents: targetMaps.monitoringAlertEvents,
    nextHabitId(): string {
      targetState.habitSequence += 1;
      return `${targetState.habitSequence}`;
    },
    nextAuditLogId(): string {
      targetState.auditLogSequence += 1;
      return `${targetState.auditLogSequence}`;
    },
    nextAuditOccurredAt(fallbackIso: string): string {
      if (targetState.latestAuditLogMs === null) {
        const fallbackMs = Date.parse(fallbackIso);
        if (!Number.isNaN(fallbackMs)) {
          targetState.latestAuditLogMs = fallbackMs;
        }
        return fallbackIso;
      }

      targetState.latestAuditLogMs += 1;
      return new Date(targetState.latestAuditLogMs).toISOString();
    },
    nextDeletionJobId(): string {
      targetState.deletionJobSequence += 1;
      return `${targetState.deletionJobSequence}`;
    },
    nextMonitoringAlertEventId(): string {
      targetState.alertEventSequence += 1;
      return `${targetState.alertEventSequence}`;
    },
    now(): string {
      return new Date().toISOString();
    },
    async withTransaction<T>(action: (client: SupabaseRepositoryClient) => Promise<T> | T): Promise<T> {
      const baseline = buildTransactionConflictBaseline(targetMaps);
      const transactionalMaps = cloneMutableMaps(targetMaps);
      const transactionalState: MutableState = { ...targetState };
      const transactionalClient = buildClient(transactionalMaps, transactionalState);

      const result = await action(transactionalClient);
      detectTransactionConflicts(baseline, transactionalMaps, targetMaps);
      applyMutableMaps(targetMaps, transactionalMaps);
      Object.assign(targetState, transactionalState);
      return result;
    },
  });

  return buildClient(maps, state);
}
