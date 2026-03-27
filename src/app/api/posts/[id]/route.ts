import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUser } from '@/lib/auth-temp';

// GET /api/posts/[id] — 글 상세 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getOrCreateDefaultUser();

  const post = await prisma.post.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      publishLogs: {
        include: { platform: { select: { name: true, type: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: '글을 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json(post);
}

// PUT /api/posts/[id] — 글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getOrCreateDefaultUser();
  const body = await request.json();
  const { title, content, keyword, status } = body;

  const existing = await prisma.post.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: '글을 찾을 수 없습니다' }, { status: 404 });
  }

  const post = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(keyword !== undefined && { keyword }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json(post);
}

// DELETE /api/posts/[id] — 글 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getOrCreateDefaultUser();

  const existing = await prisma.post.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: '글을 찾을 수 없습니다' }, { status: 404 });
  }

  await prisma.post.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
