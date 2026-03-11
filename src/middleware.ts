// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/edit', '/home', '/logs', '/membership', '/membersList']; 

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth_token');

  if (protectedRoutes.includes(request.nextUrl.pathname)) {
    if (!authCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Add all the paths to the matcher
export const config = {
  matcher: ['/edit/:path*', '/home', '/logs', '/membership', '/membersList'],
};