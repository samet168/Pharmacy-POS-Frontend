import { NextResponse } from 'next/server';

export function middleware() {
  // For now, allow all routes and let client-side handle auth
  // In production, you might want to check for session cookies
  return NextResponse.next();
}