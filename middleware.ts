import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Detect Payload routes
  const isPayloadRoute = pathname.startsWith('/admin') || pathname.startsWith('/api');
  
  // Set header for root layout to detect Payload routes
  const response = NextResponse.next();
  response.headers.set('x-is-payload-route', isPayloadRoute ? 'true' : 'false');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
