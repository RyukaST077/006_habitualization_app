type RequiredEnvKey = "E2E_BASE_URL" | "E2E_SMOKE_USER_EMAIL" | "E2E_SMOKE_USER_PASSWORD";

export type SmokeEnv = {
  baseUrl: string;
  userEmail: string;
  userPassword: string;
};

function getRequiredEnv(key: RequiredEnvKey): string {
  const value = process.env[key];

  if (!value || value.trim().length === 0) {
    throw new Error(`[E2E] Required environment variable is missing: ${key}`);
  }

  return value;
}

export function getMissingSmokeEnvKeys(): RequiredEnvKey[] {
  const keys: RequiredEnvKey[] = ["E2E_BASE_URL", "E2E_SMOKE_USER_EMAIL", "E2E_SMOKE_USER_PASSWORD"];
  return keys.filter((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });
}

export function loadSmokeEnv(): SmokeEnv {
  return {
    baseUrl: getRequiredEnv("E2E_BASE_URL"),
    userEmail: getRequiredEnv("E2E_SMOKE_USER_EMAIL"),
    userPassword: getRequiredEnv("E2E_SMOKE_USER_PASSWORD"),
  };
}
