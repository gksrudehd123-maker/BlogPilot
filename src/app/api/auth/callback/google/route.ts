import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google-oauth';
import { prisma } from '@/lib/prisma';

// GET /api/auth/callback/google?code=xxx&state=platformId
// Google OAuth 콜백 — 토큰 발급 후 Platform credentials에 저장
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const platformId = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL('/settings/sites?error=oauth_denied', request.url),
    );
  }

  if (!code || !platformId) {
    return NextResponse.redirect(
      new URL('/settings/sites?error=missing_params', request.url),
    );
  }

  try {
    const tokens = await getTokensFromCode(code);

    // Platform의 credentials에 토큰 저장
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      return NextResponse.redirect(
        new URL('/settings/sites?error=platform_not_found', request.url),
      );
    }

    const existingCredentials = (platform.credentials as Record<string, unknown>) || {};

    await prisma.platform.update({
      where: { id: platformId },
      data: {
        credentials: {
          ...existingCredentials,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
        },
      },
    });

    return NextResponse.redirect(
      new URL('/settings/sites?success=google_connected', request.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL('/settings/sites?error=token_failed', request.url),
    );
  }
}
