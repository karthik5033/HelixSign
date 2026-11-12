import { jsonResponse, parseQuery, withErrorHandling } from '@/lib/http';
import { RegistryQuerySchema } from '@/types';
import { listStamps, toRegistryStamp } from '@/services/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: Request): Promise<Response> => {
  const query = parseQuery(RegistryQuerySchema, request.url);
  const records = await listStamps(query.limit, query.offset);
  return jsonResponse({ stamps: records.map(toRegistryStamp) });
});
