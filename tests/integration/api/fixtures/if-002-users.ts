export type If002TestRoleId = "ROLE-001" | "ROLE-002";
export type If002TestUserId = "user-red-001" | "user-red-002";

export interface If002TestUserFixture {
  userId: If002TestUserId;
  roleId: If002TestRoleId;
  email: string;
}

export const IF002_TEST_ROLES: Record<If002TestRoleId, { roleId: If002TestRoleId; name: string }> = {
  "ROLE-001": { roleId: "ROLE-001", name: "standard-user" },
  "ROLE-002": { roleId: "ROLE-002", name: "restricted-user" },
};

export const IF002_TEST_USERS: Record<If002TestUserId, If002TestUserFixture> = {
  "user-red-001": {
    userId: "user-red-001",
    roleId: "ROLE-001",
    email: "user-red-001@example.test",
  },
  "user-red-002": {
    userId: "user-red-002",
    roleId: "ROLE-002",
    email: "user-red-002@example.test",
  },
};

export function hasIf002CrossUserAccess(actorUserId: string, targetUserId?: string): boolean {
  if (targetUserId == null) {
    return false;
  }

  return actorUserId !== targetUserId;
}
