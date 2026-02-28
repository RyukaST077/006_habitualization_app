import type { IncomingMessage } from "node:http";
import { URL } from "node:url";

import { defineConfig, loadEnv } from "vite";

import {
  AuthSessionService,
  type AuthSessionAuditLogPort,
  type ConsentStatusPort,
} from "./src/server/application/auth/AuthSessionService";
import type { SupabaseAuthGatewayContract } from "./src/server/application/auth/SupabaseAuthGateway";
import { createIf001CallbackHandler } from "./src/server/application/if-001/callback-handler";
import { createIf001StartHandler } from "./src/server/application/if-001/start-handler";
import type { If001StartApiRequest } from "./src/server/application/if-001/contracts";
import type { If001CallbackHandlerRequest } from "./src/server/application/if-001/callback-handler";
import type { If001CallbackDecisionResult, If001ConsentDeclineLogoutResult } from "./src/server/application/if-001/types";
import {
  decodeJwtPayload,
  extractBearerToken,
  hasLatestRequiredConsents,
  isExpiredJwt,
  normalizePolicyType,
  type PolicyConsentRow,
  type PolicySettingRow,
} from "./src/server/application/if-001/session-state-utils";
import { buildPolicyConsentRowsToInsert } from "./src/server/application/if-002/policy-consent-utils";

function parseRequestBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer | string) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown);
      } catch (error: unknown) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function getSupabaseConfig(): { baseUrl: string; serviceRoleKey: string } {
  const baseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl) {
    throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required");
  }
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }
  return { baseUrl, serviceRoleKey };
}

async function fetchSupabaseRest<T>(pathWithQuery: string): Promise<T> {
  const { baseUrl, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${baseUrl}/rest/v1/${pathWithQuery}`, {
    method: "GET",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`supabase rest error: ${response.status}`);
  }
  return (await response.json()) as T;
}

async function insertSupabasePolicyConsents(rows: Array<{ user_id: string; policy_type: string; policy_version: string; consented_at: string }>): Promise<void> {
  const { baseUrl, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${baseUrl}/rest/v1/policy_consents`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`supabase insert error: ${response.status} ${detail}`);
  }
}

async function ensureSupabaseProfileExists(userId: string): Promise<void> {
  const { baseUrl, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${baseUrl}/rest/v1/profiles?on_conflict=user_id`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify([{ user_id: userId }]),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`ensure profile error: ${response.status} ${detail}`);
  }
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const authGateway: SupabaseAuthGatewayContract = {
  async buildGoogleOAuthUrl(redirectTo: string): Promise<string> {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL is required");
    }
    const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:5173";
    const callbackUrl = new URL(redirectTo, appOrigin).toString();
    const oauthUrl = new URL("/auth/v1/authorize", supabaseUrl);
    oauthUrl.searchParams.set("provider", "google");
    oauthUrl.searchParams.set("redirect_to", callbackUrl);
    oauthUrl.searchParams.set("scopes", "openid email profile");
    return oauthUrl.toString();
  },
  async clearSession(userId: string): Promise<void> {
    void userId;
  },
};

const consentStatusPort: ConsentStatusPort = {
  async hasConsented(userId: string): Promise<boolean> {
    if (!isUuidLike(userId)) {
      return false;
    }
    try {
      const policySettings = await fetchSupabaseRest<PolicySettingRow[]>(
        "policy_settings?select=policy_type,current_version",
      );
      const requiredPolicyTypes = ["terms", "privacy"] as const;
      const settingsByType = new Map<string, string>();
      for (const setting of policySettings) {
        settingsByType.set(normalizePolicyType(setting.policy_type), setting.current_version);
      }
      if (!requiredPolicyTypes.every((policyType) => settingsByType.has(policyType))) {
        return false;
      }

      const consentRows = await fetchSupabaseRest<PolicyConsentRow[]>(
        `policy_consents?select=policy_type,policy_version,consented_at&user_id=eq.${encodeURIComponent(userId)}&order=consented_at.desc`,
      );
      return hasLatestRequiredConsents(policySettings, consentRows, requiredPolicyTypes);
    } catch (error: unknown) {
      console.error("[if-001] consent check failed; fallback to unconsented", error);
      return false;
    }
  },
};

const auditLogService: AuthSessionAuditLogPort = {
  async record(input) {
    return input;
  },
};

const authSessionService = new AuthSessionService(authGateway, consentStatusPort, auditLogService);
const startHandler = createIf001StartHandler({ authSessionService });
const callbackHandler = createIf001CallbackHandler({ authSessionService });

function normalizeCallbackResponse(
  response: If001CallbackDecisionResult | If001ConsentDeclineLogoutResult,
  consentState: If001CallbackHandlerRequest["consentState"],
): If001CallbackDecisionResult | If001ConsentDeclineLogoutResult {
  if (response.route === "SCR-001") {
    return response;
  }
  if (response.route === "SCR-002" && consentState !== "agreed") {
    return { route: "SCR-008" };
  }
  return response;
}

function isTargetRequest(req: IncomingMessage, method: "GET" | "POST", pathname: string): boolean {
  if (req.method !== method || !req.url) {
    return false;
  }
  const requestUrl = new URL(req.url, "http://localhost");
  return requestUrl.pathname === pathname;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env = { ...process.env, ...env };

  return {
  plugins: [
    {
      name: "dev-if-001-api",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (isTargetRequest(req, "POST", "/api/auth/google/start")) {
            try {
              const body = await parseRequestBody(req);
              const requestBody = typeof body === "object" && body !== null ? body : {};
              const request: If001StartApiRequest = {
                redirectTo: typeof (requestBody as { redirectTo?: unknown }).redirectTo === "string"
                  ? (requestBody as { redirectTo: string }).redirectTo
                  : undefined,
                authorization: typeof req.headers.authorization === "string" ? req.headers.authorization : undefined,
              };
              const response = await startHandler(request);

              res.statusCode = response.status;
              res.setHeader("content-type", "application/json; charset=utf-8");
              res.end(JSON.stringify(response.body));
              return;
            } catch {
              res.statusCode = 500;
              res.setHeader("content-type", "application/json; charset=utf-8");
              res.end(
                JSON.stringify({
                  code: "AUTH_PROVIDER_ERROR",
                  trace_id: "if001-start-provider-error",
                  route: "SCR-001",
                  audit_action: "LOGIN_FAILED",
                }),
              );
              return;
            }
          }

          if (isTargetRequest(req, "POST", "/api/auth/google/callback")) {
            try {
              const body = await parseRequestBody(req);
              const requestBody = typeof body === "object" && body !== null ? body : {};
              const request: If001CallbackHandlerRequest = {
                userId: typeof (requestBody as { userId?: unknown }).userId === "string"
                  ? (requestBody as { userId: string }).userId
                  : "",
                consentState: ((): If001CallbackHandlerRequest["consentState"] => {
                  const consentState = (requestBody as { consentState?: unknown }).consentState;
                  return consentState === "agreed" || consentState === "rejected" ? consentState : "unknown";
                })(),
              };
              const response = normalizeCallbackResponse(await callbackHandler(request), request.consentState);
              res.statusCode = 200;
              res.setHeader("content-type", "application/json; charset=utf-8");
              res.end(JSON.stringify(response));
              return;
            } catch (error: unknown) {
              console.error("[if-001] callback failed", error);
              res.statusCode = 500;
              res.setHeader("content-type", "application/json; charset=utf-8");
              res.end(
                JSON.stringify({
                  route: "SCR-001",
                  detail: error instanceof Error ? error.message : "unknown callback error",
                }),
              );
              return;
            }
          }

          if (isTargetRequest(req, "GET", "/api/auth/session-state")) {
            try {
              const token = extractBearerToken(typeof req.headers.authorization === "string" ? req.headers.authorization : undefined);
              if (!token) {
                res.statusCode = 200;
                res.setHeader("content-type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ authState: "unauthenticated", consentState: "unknown" }));
                return;
              }

              const payload = decodeJwtPayload(token);
              const userId = payload && typeof payload.sub === "string" ? payload.sub : null;
              if (!payload || !userId || !isUuidLike(userId) || isExpiredJwt(payload)) {
                res.statusCode = 200;
                res.setHeader("content-type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ authState: "unauthenticated", consentState: "unknown" }));
                return;
              }

              const hasConsented = await consentStatusPort.hasConsented(userId);
              res.statusCode = 200;
              res.setHeader("content-type", "application/json; charset=utf-8");
              res.end(
                JSON.stringify({
                  authState: "authenticated",
                  consentState: hasConsented ? "agreed" : "unknown",
                  userId,
                }),
              );
              return;
            } catch (error: unknown) {
              console.error("[if-001] session-state failed", error);
              res.statusCode = 200;
              res.setHeader("content-type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ authState: "unauthenticated", consentState: "unknown" }));
              return;
            }
          }

          if (isTargetRequest(req, "POST", "/api/policies/consents")) {
            try {
              const body = await parseRequestBody(req);
              const requestBody = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
              const userId = typeof requestBody.userId === "string" ? requestBody.userId : "";
              if (!isUuidLike(userId)) {
                res.statusCode = 400;
                res.setHeader("content-type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ code: "VALIDATION_ERROR", message: "userId is required" }));
                return;
              }

              await ensureSupabaseProfileExists(userId);

              const policySettings = await fetchSupabaseRest<PolicySettingRow[]>(
                "policy_settings?select=policy_type,current_version",
              );
              const latestConsentRows = await fetchSupabaseRest<PolicyConsentRow[]>(
                `policy_consents?select=policy_type,policy_version,consented_at&user_id=eq.${encodeURIComponent(userId)}&order=consented_at.desc`,
              );
              const now = new Date().toISOString();
              const rowsToInsert = buildPolicyConsentRowsToInsert(userId, policySettings, latestConsentRows, now);

              if (rowsToInsert.length > 0) {
                await insertSupabasePolicyConsents(rowsToInsert);
              }

              res.statusCode = 200;
              res.setHeader("content-type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ insertedCount: rowsToInsert.length }));
              return;
            } catch (error: unknown) {
              console.error("[if-002] policy consent insert failed", error);
              res.statusCode = 500;
              res.setHeader("content-type", "application/json; charset=utf-8");
              res.end(
                JSON.stringify({
                  code: "INTERNAL_ERROR",
                  message: "failed to persist policy consents",
                  detail: error instanceof Error ? error.message : "unknown",
                }),
              );
              return;
            }
          }

          next();
        });
      },
    },
  ],
  };
});
