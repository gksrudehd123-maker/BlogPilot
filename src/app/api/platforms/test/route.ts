import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { testConnection } from '@/lib/platforms/test-connection';

// POST /api/platforms/test
// 플랫폼 연결테스트
export async function POST(request: NextRequest) {
  const { platformId } = await request.json();

  if (!platformId) {
    return NextResponse.json(
      { error: 'platformId가 필요합니다' },
      { status: 400 },
    );
  }

  try {
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      return NextResponse.json(
        { error: '플랫폼을 찾을 수 없습니다' },
        { status: 404 },
      );
    }

    const result = await testConnection(platform);

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
