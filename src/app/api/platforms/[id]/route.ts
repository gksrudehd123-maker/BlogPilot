import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUser } from '@/lib/auth-temp';

// GET /api/platforms/[id] — 계정 상세 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getOrCreateDefaultUser();

  const platform = await prisma.platform.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!platform) {
    return NextResponse.json(
      { error: '계정을 찾을 수 없습니다' },
      { status: 404 },
    );
  }

  return NextResponse.json(platform);
}

// PUT /api/platforms/[id] — 계정 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getOrCreateDefaultUser();
  const body = await request.json();

  const existing = await prisma.platform.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: '계정을 찾을 수 없습니다' },
      { status: 404 },
    );
  }

  const { name, blogUrl, credentials, isActive } = body;

  const platform = await prisma.platform.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(blogUrl !== undefined && { blogUrl }),
      ...(credentials !== undefined && { credentials }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(platform);
}

// DELETE /api/platforms/[id] — 계정 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getOrCreateDefaultUser();

  const existing = await prisma.platform.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: '계정을 찾을 수 없습니다' },
      { status: 404 },
    );
  }

  await prisma.platform.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
