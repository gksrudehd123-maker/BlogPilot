import { NextRequest, NextResponse } from 'next/server';
import { testConnection as testBlogspot } from '@/lib/platforms/blogspot';
import { testConnection as testWordpress } from '@/lib/platforms/wordpress';
import { testNaverConnection } from '@/lib/browser/naver-automation';
import { testTistoryConnection } from '@/lib/browser/tistory-automation';
import { checkSession } from '@/lib/browser/session-manager';

// POST /api/platforms/test
// 플랫폼 연결테스트
export async function POST(request: NextRequest) {
  const { platformId, type, blogName } = await request.json();

  if (!platformId) {
    return NextResponse.json(
      { error: 'platformId가 필요합니다' },
      { status: 400 },
    );
  }

  try {
    let result;

    if (type === 'BLOGSPOT') {
      result = await testBlogspot(platformId);
    } else if (type === 'WORDPRESS') {
      result = await testWordpress(platformId);
    } else if (type === 'NAVER') {
      // 세션 체크 → 블로그 정보 조회
      const session = await checkSession('naver');
      if (!session.valid) {
        return NextResponse.json({
          success: false,
          error: session.message,
        });
      }
      const naverResult = await testNaverConnection();
      result = { name: naverResult.blogId, url: naverResult.blogUrl };
    } else if (type === 'TISTORY') {
      if (!blogName) {
        return NextResponse.json({
          success: false,
          error: '블로그 이름이 필요합니다.',
        });
      }
      const session = await checkSession('tistory');
      if (!session.valid) {
        return NextResponse.json({
          success: false,
          error: session.message,
        });
      }
      const tistoryResult = await testTistoryConnection(blogName);
      result = { name: tistoryResult.blogName, url: tistoryResult.blogUrl };
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 플랫폼입니다' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `연결 성공: ${result.name}`,
      data: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '연결에 실패했습니다';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
