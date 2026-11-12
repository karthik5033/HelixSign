import { jsonResponse, parseBody, readJson, withErrorHandling } from '@/lib/http';
import { StealthRequestSchema } from '@/types';
import { runStealthCheck } from '@/services/stealthService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: Request): Promise<Response> => {
  const body = parseBody(StealthRequestSchema, await readJson(request));
  const result = await runStealthCheck(body);
  return jsonResponse(result);
});
