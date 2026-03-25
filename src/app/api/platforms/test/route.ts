import { NextRequest, NextResponse } from 'next/server';
import { testConnection as testBlogspot } from '@/lib/platforms/blogspot';
import { testConnection as testWordpress } from '@/lib/platforms/wordpress';

// POST /api/platforms/test
// 플랫폼 연결테스트
export async function POST(request: NextRequest) {
  const { platformId, type } = await request.json();

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
    } else if (type === 'NAVER' || type === 'TISTORY') {
      return NextResponse.json({
        success: false,
        error: '네이버/티스토리는 데스크톱 앱에서 연결테스트가 가능합니다.',
      });
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
