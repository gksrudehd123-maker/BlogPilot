import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUser } from '@/lib/auth-temp';

// GET /api/platforms — 계정 목록 조회
export async function GET() {
  const user = await getOrCreateDefaultUser();

  const platforms = await prisma.platform.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(platforms);
}

// POST /api/platforms — 계정 등록
export async function POST(request: NextRequest) {
  const user = await getOrCreateDefaultUser();
  const body = await request.json();

  const { type, name, blogUrl, credentials } = body;

  if (!type || !name) {
    return NextResponse.json(
      { error: '플랫폼 타입과 계정명은 필수입니다' },
      { status: 400 },
    );
  }

  const platform = await prisma.platform.create({
    data: {
      type,
      name,
      blogUrl: blogUrl || null,
      credentials: credentials || null,
      userId: user.id,
    },
  });

  return NextResponse.json(platform, { status: 201 });
}
