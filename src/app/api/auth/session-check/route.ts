import { NextRequest, NextResponse } from 'next/server';
import { checkSession, loadCookies } from '@/lib/browser/session-manager';

/**
 * GET /api/auth/session-check?platform=naver
 * 세션 유효성 확인 (네이버/티스토리)
 *
 * quick=true: 쿠키 파일 존재 여부만 확인 (빠름)
 * quick=false (기본): 실제 브라우저로 로그인 상태 확인 (정확)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const quick = searchParams.get('quick') === 'true';

    if (platform !== 'naver' && platform !== 'tistory') {
      return NextResponse.json(
        { error: '지원하지 않는 플랫폼입니다. naver 또는 tistory만 가능합니다.' },
        { status: 400 },
      );
    }

    // 빠른 체크: 쿠키 파일만 확인
    if (quick) {
      const cookies = loadCookies(platform);
      const hasCookies = cookies !== null && cookies.length > 0;
      return NextResponse.json({
        valid: hasCookies,
        message: hasCookies
          ? `${platform === 'naver' ? '네이버' : '티스토리'} 세션 파일 존재`
          : '저장된 세션이 없습니다.',
      });
    }

    // 정확한 체크: 실제 브라우저로 확인
    const result = await checkSession(platform);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: `세션 확인 실패: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    );
  }
}
