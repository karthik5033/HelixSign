export function isStubMode(): boolean {
  const value = process.env.USE_STUBS;
  if (value === undefined) return true;
  return !['false', '0', 'no', 'off'].includes(value.trim().toLowerCase());
}

export function getMlServiceUrl(): string {
  return (process.env.ML_SERVICE_URL ?? 'http://127.0.0.1:8000').replace(/\/+$/, '');
}

export function getAllowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getSupabaseConfig(): { url: string; serviceKey: string } | null {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!url || !serviceKey) return null;
  if (url.includes('your-project') || serviceKey.includes('your-')) return null;
  return { url, serviceKey };
}

export function isDatabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export const SERVICE_VERSION = process.env.npm_package_version ?? '0.1.0';
