export type Role = "ROLE-001" | "ROLE-002" | "system";

export class AuthorizationPolicyError extends Error {
  public readonly code = "FORBIDDEN";

  public constructor(message = "access denied") {
    super(message);
    this.name = "AuthorizationPolicyError";
  }
}

export class AuthorizationPolicyService {
  public assertSelf(userId: string, targetUserId?: string): void {
    if (targetUserId == null) {
      return;
    }

    if (userId !== targetUserId) {
      throw new AuthorizationPolicyError();
    }
  }

  public assertOpsRole(role: Role): void {
    if (role !== "ROLE-002") {
      throw new AuthorizationPolicyError();
    }
  }
}
