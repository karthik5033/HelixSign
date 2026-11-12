import { jsonResponse, withErrorHandling } from '@/lib/http';
import { SERVICE_VERSION, isStubMode } from '@/lib/env';
import { mlServiceHealthy } from '@/services/mlClient';
import { databaseHealthy } from '@/services/registry';
import type { HealthResponse } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (): Promise<Response> => {
  const [mlServiceConnected, databaseConnected] = await Promise.all([
    mlServiceHealthy(),
    databaseHealthy(),
  ]);

  const body: HealthResponse = {
    status: 'ok',
    version: SERVICE_VERSION,
    stubsActive: isStubMode(),
    mlServiceConnected,
    databaseConnected,
  };

  return jsonResponse(body);
});
