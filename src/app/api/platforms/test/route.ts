import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/platforms/blogspot';

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
    if (type === 'BLOGSPOT') {
      const result = await testConnection(platformId);
      return NextResponse.json({
        success: true,
        message: `연결 성공: ${result.name}`,
        data: result,
      });
    }

    return NextResponse.json(
      { error: '지원하지 않는 플랫폼입니다' },
      { status: 400 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '연결에 실패했습니다';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
