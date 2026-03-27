import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUser } from '@/lib/auth-temp';

// GET /api/posts — 글 목록 조회
export async function GET(request: NextRequest) {
  const user = await getOrCreateDefaultUser();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;

  const where: Record<string, unknown> = { userId: user.id };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { keyword: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        publishLogs: {
          include: { platform: { select: { name: true, type: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { publishLogs: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    data: posts,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/posts — 새 글 저장 (DRAFT)
export async function POST(request: NextRequest) {
  const user = await getOrCreateDefaultUser();
  const body = await request.json();
  const { title, content, keyword } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: '제목과 내용은 필수입니다' },
      { status: 400 },
    );
  }

  const post = await prisma.post.create({
    data: {
      title,
      content,
      keyword: keyword || null,
      status: 'DRAFT',
      userId: user.id,
    },
  });

  return NextResponse.json(post);
}
