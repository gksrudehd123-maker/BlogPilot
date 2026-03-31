import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUser } from '@/lib/auth-temp';

// GET /api/keywords — 키워드 목록 조회
export async function GET() {
  const user = await getOrCreateDefaultUser();

  const keywords = await prisma.keyword.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(keywords);
}

// POST /api/keywords — 키워드 추가
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { keyword, searchVolume, pcSearchVolume, mobileSearchVolume, competition } = body;

  if (!keyword) {
    return NextResponse.json(
      { error: '키워드는 필수입니다' },
      { status: 400 },
    );
  }

  const user = await getOrCreateDefaultUser();

  // 중복 체크
  const existing = await prisma.keyword.findUnique({
    where: {
      keyword_userId: {
        keyword: keyword.trim(),
        userId: user.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: '이미 등록된 키워드입니다' },
      { status: 409 },
    );
  }

  const created = await prisma.keyword.create({
    data: {
      keyword: keyword.trim(),
      userId: user.id,
      ...(searchVolume != null ? { searchVolume } : {}),
      ...(pcSearchVolume != null ? { pcSearchVolume } : {}),
      ...(mobileSearchVolume != null ? { mobileSearchVolume } : {}),
      ...(competition ? { competition } : {}),
    },
  });

  return NextResponse.json(created);
}

// DELETE /api/keywords — 키워드 삭제
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'id는 필수입니다' },
      { status: 400 },
    );
  }

  await prisma.keyword.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
