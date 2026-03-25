import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUser } from '@/lib/auth-temp';
import { publishPost as publishBlogspot } from '@/lib/platforms/blogspot';
import { publishPost as publishWordpress } from '@/lib/platforms/wordpress';
import { publishNaverPost } from '@/lib/browser/naver-automation';
import { publishTistoryPost } from '@/lib/browser/tistory-automation';

// POST /api/publish
// 선택한 플랫폼에 글 발행
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, content, keyword, platformIds } = body;

  if (!title || !content || !platformIds?.length) {
    return NextResponse.json(
      { error: '제목, 내용, 발행 플랫폼은 필수입니다' },
      { status: 400 },
    );
  }

  const user = await getOrCreateDefaultUser();

  // 글을 Post 테이블에 저장
  const post = await prisma.post.create({
    data: {
      title,
      content,
      keyword: keyword || null,
      status: 'PUBLISHING',
      userId: user.id,
    },
  });

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
      let publishedUrl: string | null | undefined;

      if (platform.type === 'BLOGSPOT') {
        const result = await publishBlogspot(platformId, title, content);
        publishedUrl = result.url;
      } else if (platform.type === 'WORDPRESS') {
        const result = await publishWordpress(platformId, title, content);
        publishedUrl = result.url;
      } else if (platform.type === 'NAVER') {
        const result = await publishNaverPost(title, content);
        publishedUrl = result.url;
      } else if (platform.type === 'TISTORY') {
        const creds = platform.credentials as Record<string, string> | null;
        const blogName = creds?.blogName;
        if (!blogName) {
          throw new Error('티스토리 블로그 이름이 설정되지 않았습니다. 사이트 설정에서 블로그 이름을 입력해주세요.');
        }
        const result = await publishTistoryPost(blogName, title, content);
        publishedUrl = result.url;
      } else {
        results.push({
          platform: platform.name,
          type: platform.type,
          success: false,
          error: '지원하지 않는 플랫폼입니다',
        });
        continue;
      }

      // 발행 로그 저장
      await prisma.publishLog.create({
        data: {
          postId: post.id,
          platformId: platform.id,
          status: 'SUCCESS',
          publishedUrl: publishedUrl ?? null,
          publishedAt: new Date(),
        },
      });

      results.push({
        platform: platform.name,
        type: platform.type,
        success: true,
        url: publishedUrl,
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

  // 모든 발행 결과에 따라 Post 상태 업데이트
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
