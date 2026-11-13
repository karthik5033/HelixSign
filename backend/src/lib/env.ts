export function isStubMode(): boolean {
  const value = process.env.USE_STUBS;
  if (value === undefined) return false;
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

export const SERVICE_VERSION = process.env.npm_package_version ?? '0.1.0';
