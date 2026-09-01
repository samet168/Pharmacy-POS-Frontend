import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route protection
 * Handles authentication and basic route access control
 */

// Public routes that don't require authentication
const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/pin-login'];

// API routes that should be handled by the backend
const apiRoutes = ['/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Explicitly redirect any /register access to /login
  if (pathname === '/register' || pathname.startsWith('/register/')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Allow API routes to pass through to backend
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check for authentication - use lightweight session cookie
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true';
  
  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Allow authenticated routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};