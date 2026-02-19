type SupabaseTestEnv = {
  supabaseEnv: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

const PROD_ENV_VALUES = new Set(["prod", "production"]);
const PROD_URL_KEYWORDS = ["prod", "production"];

function isProductionLikeUrl(url: string): boolean {
  return PROD_URL_KEYWORDS.some((keyword) =>
    url.toLowerCase().includes(keyword)
  );
}

function readEnvWithFallback(source: NodeJS.ProcessEnv): SupabaseTestEnv {
  const supabaseEnv = source.SUPABASE_ENV ?? "dev";
  const supabaseUrl = source.SUPABASE_URL ?? "https://dev.local.supabase.co";
  const supabaseAnonKey = source.SUPABASE_ANON_KEY ?? "dummy-anon-key";

  return { supabaseEnv, supabaseUrl, supabaseAnonKey };
}

export function validateSupabaseTestEnv(
  source: NodeJS.ProcessEnv = process.env
): SupabaseTestEnv {
  const env = readEnvWithFallback(source);

  if (!env.supabaseEnv || !env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Missing required env");
  }

  if (PROD_ENV_VALUES.has(env.supabaseEnv.toLowerCase())) {
    throw new Error("Production forbidden");
  }

  if (isProductionLikeUrl(env.supabaseUrl)) {
    throw new Error("Production forbidden");
  }

  return env;
}
