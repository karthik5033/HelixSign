import { ApiError, jsonResponse, parseBody, readJson, withErrorHandling } from '@/lib/http';
import { checkRateLimit, clientKey } from '@/lib/rateLimit';
import { StressRequestSchema } from '@/types';
import { runStressTest } from '@/services/stressService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: Request): Promise<Response> => {
  if (!checkRateLimit(clientKey(request, 'stress'), 20)) {
    throw new ApiError(429, 'RATE_LIMITED', 'Too many stress simulations; try again shortly');
  }
  const body = parseBody(StressRequestSchema, await readJson(request));
  const result = await runStressTest(body);
  return jsonResponse(result);
});
