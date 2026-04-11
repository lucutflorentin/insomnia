import { SignJWT, jwtVerify } from 'jose';
import { compare, hash } from 'bcryptjs';
import { cookies } from 'next/headers';
import type { UserRole } from '@/types';

// --- Secret validation at startup ---
const rawJwtSecret = process.env.JWT_SECRET;
if (!rawJwtSecret || rawJwtSecret.length < 32) {
  throw new Error(
    'JWT_SECRET must be set and at least 32 characters. Generate one with: openssl rand -base64 48',
  );
}
const rawJwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
if (!rawJwtRefreshSecret || rawJwtRefreshSecret.length < 32) {
  throw new Error(
    'JWT_REFRESH_SECRET must be set and at least 32 characters. Generate one with: openssl rand -base64 48',
  );
}

const JWT_SECRET = new TextEncoder().encode(rawJwtSecret);
const JWT_REFRESH_SECRET = new TextEncoder().encode(rawJwtRefreshSecret);

export interface JWTPayload {
  sub: string; // User.id as string
  email: string;
  name: string;
  role: UserRole;
  artistId?: number; // only for ARTIST role
}

// --- Token signing ---

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_REFRESH_SECRET);
}

// --- Token verification ---

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as unknown as JWTPayload;
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
  return payload as unknown as JWTPayload;
}

// --- Password helpers ---

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return compare(password, hashedPassword);
}

// --- Cookie management ---

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set('insomnia_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60, // 15 minutes
  });

  cookieStore.set('insomnia_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('insomnia_token');
  cookieStore.delete('insomnia_refresh');
}

// --- Request verification ---

function extractToken(request: Request): string {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    throw new Error('No authentication cookie');
  }

  const tokenMatch = cookieHeader.match(/insomnia_token=([^;]+)/);
  if (!tokenMatch) {
    throw new Error('No access token');
  }

  return tokenMatch[1];
}

/** Verify any authenticated user. Returns the JWT payload. */
export async function verifyAuthRequest(
  request: Request,
): Promise<JWTPayload> {
  return verifyToken(extractToken(request));
}

/** Legacy alias — verify admin (SUPER_ADMIN or ARTIST) request. */
export async function verifyAdminRequest(
  request: Request,
): Promise<JWTPayload> {
  const payload = await verifyAuthRequest(request);
  if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ARTIST') {
    throw new Error('Insufficient permissions');
  }
  return payload;
}

/** Verify the request comes from a user with one of the allowed roles. */
export async function verifyRole(
  request: Request,
  allowedRoles: UserRole[],
): Promise<JWTPayload> {
  const payload = await verifyAuthRequest(request);
  if (!allowedRoles.includes(payload.role)) {
    throw new Error('Insufficient permissions');
  }
  return payload;
}

/** Shortcut: verify SUPER_ADMIN only. */
export async function verifySuperAdmin(
  request: Request,
): Promise<JWTPayload> {
  return verifyRole(request, ['SUPER_ADMIN']);
}

/** For ARTIST role: ensures the JWT's artistId matches the requested resource.
 *  SUPER_ADMIN bypasses this check. */
export async function verifyArtistOwnership(
  request: Request,
  artistId: number,
): Promise<JWTPayload> {
  const payload = await verifyAdminRequest(request);
  if (payload.role === 'SUPER_ADMIN') return payload;
  if (payload.artistId !== artistId) {
    throw new Error('Cannot access another artist\'s resource');
  }
  return payload;
}

/** For CLIENT role: ensures the JWT's user id matches the requested resource.
 *  SUPER_ADMIN bypasses this check. */
export async function verifyClientOwnership(
  request: Request,
  userId: number,
): Promise<JWTPayload> {
  const payload = await verifyAuthRequest(request);
  if (payload.role === 'SUPER_ADMIN') return payload;
  if (Number(payload.sub) !== userId) {
    throw new Error('Cannot access another user\'s resource');
  }
  return payload;
}

/** Get current user from request, or null if not authenticated. */
export async function getCurrentUser(
  request: Request,
): Promise<JWTPayload | null> {
  try {
    return await verifyAuthRequest(request);
  } catch {
    return null;
  }
}

// --- Google OAuth verification ---

export async function verifyGoogleToken(
  idToken: string,
): Promise<{ email: string; name: string; googleId: string; avatarUrl?: string }> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
  );

  if (!response.ok) {
    throw new Error('Invalid Google token');
  }

  const data = await response.json();

  // Verify the token is for our app — mandatory check
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is required for Google OAuth');
  }
  if (data.aud !== clientId) {
    throw new Error('Google token audience mismatch');
  }

  return {
    email: data.email,
    name: data.name || data.email.split('@')[0],
    googleId: data.sub,
    avatarUrl: data.picture || undefined,
  };
}
