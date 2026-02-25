import {
  AuthorizationPolicyError,
  AuthorizationPolicyService,
} from "../authz/AuthorizationPolicyService";
import { createIf002HandledError } from "./error-mapper";

export interface If002SelfOnlyAuthorizationInput {
  actorUserId: string;
  targetUserId?: string;
  requirementId: string;
}

const AUTHORIZATION_REQUIREMENT_ID = "FR-025";
const authorizationPolicyService = new AuthorizationPolicyService();

export function assertIf002SelfOnlyAccess({
  actorUserId,
  targetUserId,
  requirementId,
}: If002SelfOnlyAuthorizationInput): void {
  void requirementId;

  try {
    authorizationPolicyService.assertSelf(actorUserId, targetUserId);
  } catch (error: unknown) {
    if (error instanceof AuthorizationPolicyError) {
      throw createIf002HandledError("FORBIDDEN", error.message, AUTHORIZATION_REQUIREMENT_ID);
    }

    throw error;
  }
}
