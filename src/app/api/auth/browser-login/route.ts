import { NextRequest, NextResponse } from 'next/server';
import { openLoginBrowser } from '@/lib/browser/session-manager';

/**
 * POST /api/auth/browser-login
 * 수동 로그인 브라우저 띄우기 (네이버/티스토리)
 * body: { platform: 'naver' | 'tistory', blogName?: string }
 * blogName은 티스토리 전용 — 서브도메인 쿠키 확보에 필요 (예: 'handongmoa')
 *
 * 로컬 전용 — headful 브라우저를 띄워 사용자가 직접 로그인
 */
export async function POST(request: NextRequest) {
  try {
    const { platform, blogName } = await request.json();

    if (platform !== 'naver' && platform !== 'tistory') {
      return NextResponse.json(
        { error: '지원하지 않는 플랫폼입니다. naver 또는 tistory만 가능합니다.' },
        { status: 400 },
      );
    }

    const result = await openLoginBrowser(platform, blogName);

    if (result.success) {
      return NextResponse.json({ message: result.message });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: `브라우저 로그인 실패: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    );
  }
}
