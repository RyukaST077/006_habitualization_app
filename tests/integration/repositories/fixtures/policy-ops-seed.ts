export interface PolicySettingSeed {
  policyType: "terms" | "privacy";
  version: number;
  contentHash: string;
  isActive: boolean;
}

export interface PolicyConsentSeed {
  userId: string;
  policyType: "terms" | "privacy";
  policyVersion: number;
  consentedAt: string;
}

export interface AuditLogSeed {
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
}

export interface DailyKpiSeed {
  kpiDate: string;
  metricName: string;
  metricValue: number;
}

export interface DeletionJobSeed {
  jobId: string;
  userId: string;
  status: "pending" | "running" | "completed" | "failed";
}

export interface MonitoringAlertEventSeed {
  eventId: string;
  alertType: string;
  dispatched: boolean;
}

export interface PolicyOpsSeedBundle {
  settings: PolicySettingSeed[];
  consents: PolicyConsentSeed[];
  auditLog: AuditLogSeed;
  dailyKpi: DailyKpiSeed;
  deletionJob: DeletionJobSeed;
  monitoringAlertEvent: MonitoringAlertEventSeed;
}

const DEFAULT_SETTINGS: PolicySettingSeed[] = [
  {
    policyType: "terms",
    version: 2,
    contentHash: "hash-terms-v2",
    isActive: true,
  },
  {
    policyType: "privacy",
    version: 3,
    contentHash: "hash-privacy-v3",
    isActive: true,
  },
];

const DEFAULT_CONSENTS: PolicyConsentSeed[] = [
  {
    userId: "user-red-001",
    policyType: "terms",
    policyVersion: 2,
    consentedAt: "2026-02-20T00:00:00.000Z",
  },
];

const DEFAULT_AUDIT_LOG: AuditLogSeed = {
  actorUserId: "admin-red-001",
  action: "policy.update",
  resourceType: "policy_settings",
  resourceId: "terms:2",
};

const DEFAULT_DAILY_KPI: DailyKpiSeed = {
  kpiDate: "2026-02-20",
  metricName: "active_users",
  metricValue: 10,
};

const DEFAULT_DELETION_JOB: DeletionJobSeed = {
  jobId: "del-red-001",
  userId: "user-red-001",
  status: "pending",
};

const DEFAULT_MONITORING_ALERT_EVENT: MonitoringAlertEventSeed = {
  eventId: "alert-red-001",
  alertType: "kpi.threshold",
  dispatched: false,
};

export function createPolicyOpsSeedBundle(overrides?: Partial<PolicyOpsSeedBundle>): PolicyOpsSeedBundle {
  return {
    settings: overrides?.settings ?? DEFAULT_SETTINGS,
    consents: overrides?.consents ?? DEFAULT_CONSENTS,
    auditLog: {
      ...DEFAULT_AUDIT_LOG,
      ...(overrides?.auditLog ?? {}),
    },
    dailyKpi: {
      ...DEFAULT_DAILY_KPI,
      ...(overrides?.dailyKpi ?? {}),
    },
    deletionJob: {
      ...DEFAULT_DELETION_JOB,
      ...(overrides?.deletionJob ?? {}),
    },
    monitoringAlertEvent: {
      ...DEFAULT_MONITORING_ALERT_EVENT,
      ...(overrides?.monitoringAlertEvent ?? {}),
    },
  };
}
