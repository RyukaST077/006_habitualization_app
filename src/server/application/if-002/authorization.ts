import { createIf002HandledError } from "./error-mapper";

export interface If002SelfOnlyAuthorizationInput {
  actorUserId: string;
  targetUserId?: string;
  requirementId: string;
}

export function assertIf002SelfOnlyAccess({
  actorUserId,
  targetUserId,
  requirementId,
}: If002SelfOnlyAuthorizationInput): void {
  if (targetUserId == null) {
    return;
  }

  if (actorUserId !== targetUserId) {
    throw createIf002HandledError("FORBIDDEN", "access denied", requirementId);
  }
}
