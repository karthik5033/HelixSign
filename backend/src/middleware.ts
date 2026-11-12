import { NextResponse, type NextRequest } from 'next/server';
import { getAllowedOrigins } from '@/lib/env';

const ALLOWED_METHODS = 'GET, POST, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, Authorization';

export function middleware(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = Boolean(
    origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin)),
  );

  const headers = new Headers();
  if (isAllowed && origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
  headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  headers.set('Access-Control-Max-Age', '86400');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
