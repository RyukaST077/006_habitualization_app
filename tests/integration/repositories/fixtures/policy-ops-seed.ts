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

export function createPolicyOpsSeedBundle(overrides?: Partial<PolicyOpsSeedBundle>): PolicyOpsSeedBundle {
  return {
    settings:
      overrides?.settings ??
      [
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
      ],
    consents:
      overrides?.consents ??
      [
        {
          userId: "user-red-001",
          policyType: "terms",
          policyVersion: 2,
          consentedAt: "2026-02-20T00:00:00.000Z",
        },
      ],
    auditLog: {
      actorUserId: "admin-red-001",
      action: "policy.update",
      resourceType: "policy_settings",
      resourceId: "terms:2",
      ...(overrides?.auditLog ?? {}),
    },
    dailyKpi: {
      kpiDate: "2026-02-20",
      metricName: "active_users",
      metricValue: 10,
      ...(overrides?.dailyKpi ?? {}),
    },
    deletionJob: {
      jobId: "del-red-001",
      userId: "user-red-001",
      status: "pending",
      ...(overrides?.deletionJob ?? {}),
    },
    monitoringAlertEvent: {
      eventId: "alert-red-001",
      alertType: "kpi.threshold",
      dispatched: false,
      ...(overrides?.monitoringAlertEvent ?? {}),
    },
  };
}
