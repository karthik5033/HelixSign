import { jsonResponse, parseBody, readJson, withErrorHandling } from '@/lib/http';
import { StampRequestSchema } from '@/types';
import { stampSequence } from '@/services/stampService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: Request): Promise<Response> => {
  const body = parseBody(StampRequestSchema, await readJson(request));
  const result = await stampSequence(body);
  return jsonResponse(result);
});
