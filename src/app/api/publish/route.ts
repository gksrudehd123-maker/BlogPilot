import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUser } from '@/lib/auth-temp';
import { publish } from '@/lib/platforms/publish';

// POST /api/publish
// 선택한 플랫폼에 글 발행
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, content, keyword, platformIds, postId } = body;

  if (!title || !content || !platformIds?.length) {
    return NextResponse.json(
      { error: '제목, 내용, 발행 플랫폼은 필수입니다' },
      { status: 400 },
    );
  }

  const user = await getOrCreateDefaultUser();

  // 기존 Post가 있으면 업데이트, 없으면 새로 생성
  let post;
  if (postId) {
    post = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        content,
        keyword: keyword || null,
        status: 'PUBLISHING',
      },
    });
  } else {
    post = await prisma.post.create({
      data: {
        title,
        content,
        keyword: keyword || null,
        status: 'PUBLISHING',
        userId: user.id,
      },
    });
  }

  // 각 플랫폼에 발행
  const results = [];

  for (const platformId of platformIds) {
    const platform = await prisma.platform.findFirst({
      where: { id: platformId, userId: user.id },
    });

    if (!platform) {
      results.push({
        platform: platformId,
        type: 'UNKNOWN',
        success: false,
        error: '플랫폼을 찾을 수 없습니다',
      });
      continue;
    }

    try {
      const result = await publish(platform, title, content);

      await prisma.publishLog.create({
        data: {
          postId: post.id,
          platformId: platform.id,
          status: 'SUCCESS',
          publishedUrl: result.url,
          publishedAt: new Date(),
        },
      });

      results.push({
        platform: platform.name,
        type: platform.type,
        success: true,
        url: result.url,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '발행에 실패했습니다';

      await prisma.publishLog.create({
        data: {
          postId: post.id,
          platformId: platform.id,
          status: 'FAILED',
          errorMessage: message,
        },
      });

      results.push({
        platform: platform.name,
        type: platform.type,
        success: false,
        error: message,
      });
    }
  }

  // Post 상태 업데이트
  const anySuccess = results.some((r) => r.success);

  await prisma.post.update({
    where: { id: post.id },
    data: {
      status: anySuccess ? 'PUBLISHED' : 'FAILED',
    },
  });

  return NextResponse.json({
    success: true,
    results,
  });
}
