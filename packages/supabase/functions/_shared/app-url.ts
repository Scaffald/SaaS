const BASE_URL_ENV_KEYS = [
  "TEAM_APP_BASE_URL",
  "EXPO_PUBLIC_URL",
  "SUPABASE_SITE_URL",
  "SITE_URL",
] as const;

function getEnvValue(key: string): string | undefined {
  const value = Deno.env.get(key);
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function resolveAppBaseUrl(): string {
  for (const key of BASE_URL_ENV_KEYS) {
    const value = getEnvValue(key);
    if (value) {
      return normalizeBaseUrl(value);
    }
  }

  return "https://app.scaffald.com";
}

export function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function buildAppUrl(path: string): string {
  const base = resolveAppBaseUrl();
  if (!path) return base;
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

