import { jsonResponse, parseBody, readJson, withErrorHandling } from '@/lib/http';
import { VerifyRequestSchema } from '@/types';
import { verifyAndFormat } from '@/services/verifyService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: Request): Promise<Response> => {
  const body = parseBody(VerifyRequestSchema, await readJson(request));
  const result = await verifyAndFormat(body.sequence);
  return jsonResponse(result);
});
