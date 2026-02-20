export type RepositoryId = "M-101" | "M-102" | "M-103" | "M-104";
export type RepositoryCategory = "CRUD" | "Tx" | "競合";

export type RepositoryConflictCode =
  | "OPTIMISTIC_LOCK_CONFLICT"
  | "CHECKIN_CONFLICT"
  | "POLICY_VERSION_CONFLICT";

export interface RepositoryRedCase {
  repositoryId: RepositoryId;
  method: string;
  category: RepositoryCategory;
  traceId: string;
  expectedFailure: RepositoryConflictCode | "NOT_IMPLEMENTED";
}

export const REPOSITORY_RED_CASES: RepositoryRedCase[] = [
  {
    repositoryId: "M-101",
    method: "findProfile",
    category: "CRUD",
    traceId: "M-101/CRUD/findProfile",
    expectedFailure: "NOT_IMPLEMENTED",
  },
  {
    repositoryId: "M-101",
    method: "updateProfileSettings",
    category: "競合",
    traceId: "M-101/競合/updateProfileSettings/version",
    expectedFailure: "OPTIMISTIC_LOCK_CONFLICT",
  },
  {
    repositoryId: "M-102",
    method: "createHabit",
    category: "CRUD",
    traceId: "M-102/CRUD/createHabit",
    expectedFailure: "NOT_IMPLEMENTED",
  },
  {
    repositoryId: "M-102",
    method: "upsertCheckin",
    category: "競合",
    traceId: "M-102/競合/upsertCheckin/unique",
    expectedFailure: "CHECKIN_CONFLICT",
  },
  {
    repositoryId: "M-103",
    method: "insertConsents",
    category: "Tx",
    traceId: "M-103/Tx/insertConsents",
    expectedFailure: "NOT_IMPLEMENTED",
  },
  {
    repositoryId: "M-103",
    method: "updatePolicySetting",
    category: "競合",
    traceId: "M-103/競合/updatePolicySetting/version",
    expectedFailure: "POLICY_VERSION_CONFLICT",
  },
  {
    repositoryId: "M-104",
    method: "insertAuditLog",
    category: "CRUD",
    traceId: "M-104/CRUD/insertAuditLog",
    expectedFailure: "NOT_IMPLEMENTED",
  },
  {
    repositoryId: "M-104",
    method: "createDeletionJob",
    category: "Tx",
    traceId: "M-104/Tx/createDeletionJob",
    expectedFailure: "NOT_IMPLEMENTED",
  },
];

export const REPOSITORY_CATEGORIES: RepositoryCategory[] = ["CRUD", "Tx", "競合"];

export const REPOSITORY_CONFLICT_CODES: RepositoryConflictCode[] = [
  "OPTIMISTIC_LOCK_CONFLICT",
  "CHECKIN_CONFLICT",
  "POLICY_VERSION_CONFLICT",
];
