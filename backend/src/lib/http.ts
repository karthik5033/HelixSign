import { z } from 'zod';
import type { ApiErrorBody } from '@/types';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function jsonResponse<T>(body: T, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
    },
  });
}

export function errorResponse(error: ApiError): Response {
  const body: ApiErrorBody = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    },
  };
  return jsonResponse(body, error.status);
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }
}

export function parseBody<S extends z.ZodTypeAny>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed', result.error.flatten());
  }
  return result.data;
}

export function parseQuery<S extends z.ZodTypeAny>(schema: S, url: string): z.output<S> {
  const params = Object.fromEntries(new URL(url).searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Query validation failed', result.error.flatten());
  }
  return result.data;
}

/**
 * Wrap a route handler so unexpected failures return a stable JSON error
 * instead of an HTML stack trace.
 */
export function withErrorHandling(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof ApiError) return errorResponse(error);
      console.error('[helixsign] unhandled API error:', error);
      return errorResponse(
        new ApiError(500, 'INTERNAL_ERROR', 'An unexpected backend error occurred'),
      );
    }
  };
}
