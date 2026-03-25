import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-oauth';

// GET /api/auth/google?platformId=xxx
// Google OAuth 인증 페이지로 리다이렉트
export async function GET(request: NextRequest) {
  const platformId = request.nextUrl.searchParams.get('platformId');

  if (!platformId) {
    return NextResponse.json(
      { error: 'platformId가 필요합니다' },
      { status: 400 },
    );
  }

  const authUrl = getAuthUrl(platformId);
  return NextResponse.redirect(authUrl);
}
