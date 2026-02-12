export type Role = 'ROLE-001' | 'ROLE-002' | 'system';

export class AuthorizationPolicyService {
  assertSelf(userId: string, targetUserId: string): void {
    if (userId !== targetUserId) {
      throw new Error('FORBIDDEN');
    }
  }

  assertOpsRole(role: Role): void {
    if (role !== 'ROLE-002') {
      throw new Error('FORBIDDEN');
    }
  }
}
