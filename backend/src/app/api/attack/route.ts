import { ApiError, jsonResponse, parseBody, readJson, withErrorHandling } from '@/lib/http';
import { checkRateLimit, clientKey } from '@/lib/rateLimit';
import { AttackRequestSchema } from '@/types';
import { runAttack } from '@/services/attackService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: Request): Promise<Response> => {
  if (!checkRateLimit(clientKey(request, 'attack'), 30)) {
    throw new ApiError(429, 'RATE_LIMITED', 'Too many attack simulations; try again shortly');
  }
  const body = parseBody(AttackRequestSchema, await readJson(request));
  const result = await runAttack(body);
  return jsonResponse(result);
});
