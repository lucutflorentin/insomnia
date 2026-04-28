import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { routing } from './i18n/routing';
import { matchesPathSection, stripLocale } from './lib/routes';

const intlMiddleware = createMiddleware(routing);

// Paths that don't require auth within their respective sections
const PUBLIC_ADMIN_PATHS = ['/admin/login'];
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register'];

// Admin paths restricted to SUPER_ADMIN only
const SUPER_ADMIN_ONLY_PATHS = ['/admin/artists', '/admin/settings', '/admin/loyalty', '/admin/reviews', '/admin/users', '/admin/content', '/admin/audit-log'];

function isAdminPath(pathname: string): boolean {
  return matchesPathSection(pathname, '/admin');
}

function isArtistPath(pathname: string): boolean {
  return matchesPathSection(pathname, '/artist');
}

function isAccountPath(pathname: string): boolean {
  return matchesPathSection(pathname, '/account');
}

function isPublicAdminPath(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  return PUBLIC_ADMIN_PATHS.some((path) => stripped === path);
}

function isPublicAuthPath(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  return PUBLIC_AUTH_PATHS.some((path) => stripped === path);
}

function isSuperAdminOnlyPath(pathname: string): boolean {
  return SUPER_ADMIN_ONLY_PATHS.some((path) => matchesPathSection(pathname, path));
}

/** Validate redirect target is a safe internal path */
function sanitizeRedirect(value: string): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\') || value.includes('://')) {
    return null;
  }
  return value;
}

interface TokenPayload {
  sub: string;
  role: string;
  artistId?: number;
}

async function verifyJWT(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('insomnia_token')?.value;

  // --- Admin routes protection ---
  if (isAdminPath(pathname) && !isPublicAdminPath(pathname)) {
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      const safeRedirect = sanitizeRedirect(pathname);
      if (safeRedirect) loginUrl.searchParams.set('redirect', safeRedirect);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      const loginUrl = new URL('/admin/login', request.url);
      const safeRedirect = sanitizeRedirect(pathname);
      if (safeRedirect) loginUrl.searchParams.set('redirect', safeRedirect);
      return NextResponse.redirect(loginUrl);
    }

    // Only SUPER_ADMIN can access admin panel; ARTIST redirected to /artist
    if (payload.role === 'ARTIST') {
      return NextResponse.redirect(new URL('/artist', request.url));
    }
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // SUPER_ADMIN-only sections
    if (isSuperAdminOnlyPath(pathname) && payload.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // --- Artist panel routes protection ---
  if (isArtistPath(pathname)) {
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      const safeRedirect = sanitizeRedirect(pathname);
      if (safeRedirect) loginUrl.searchParams.set('redirect', safeRedirect);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      const loginUrl = new URL('/admin/login', request.url);
      const safeRedirect = sanitizeRedirect(pathname);
      if (safeRedirect) loginUrl.searchParams.set('redirect', safeRedirect);
      return NextResponse.redirect(loginUrl);
    }

    // Only ARTIST and SUPER_ADMIN can access artist panel
    if (payload.role !== 'ARTIST' && payload.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // --- Client account routes protection ---
  if (isAccountPath(pathname)) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      const safeRedirect = sanitizeRedirect(pathname);
      if (safeRedirect) loginUrl.searchParams.set('redirect', safeRedirect);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      const loginUrl = new URL('/auth/login', request.url);
      const safeRedirect = sanitizeRedirect(pathname);
      if (safeRedirect) loginUrl.searchParams.set('redirect', safeRedirect);
      return NextResponse.redirect(loginUrl);
    }
  }

  // --- Redirect logged-in users away from auth pages ---
  if (isPublicAuthPath(pathname) && token) {
    const payload = await verifyJWT(token);
    if (payload) {
      if (payload.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      if (payload.role === 'ARTIST') {
        return NextResponse.redirect(new URL('/artist', request.url));
      }
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }

  // Apply i18n middleware for all routes
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - Next.js internals
    // - Static files
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
