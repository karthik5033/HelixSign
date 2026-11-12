import { ApiError, jsonResponse, parseBody, readJson, withErrorHandling } from '@/lib/http';
import { checkRateLimit, clientKey } from '@/lib/rateLimit';
import { TraceRequestSchema } from '@/types';
import { runTrace } from '@/services/traceService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: Request): Promise<Response> => {
  if (!checkRateLimit(clientKey(request, 'trace'), 20)) {
    throw new ApiError(429, 'RATE_LIMITED', 'Too many trace queries; try again shortly');
  }
  const body = parseBody(TraceRequestSchema, await readJson(request));
  const result = await runTrace(body.suspectSequence);
  return jsonResponse(result);
});
