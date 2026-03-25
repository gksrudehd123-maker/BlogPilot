import { type Platform } from '@prisma/client';
import { publishPost as publishBlogspot } from './blogspot';
import { publishPost as publishWordpress } from './wordpress';
import { publishNaverPost } from '@/lib/browser/naver-automation';
import { publishTistoryPost } from '@/lib/browser/tistory-automation';

export interface PublishResult {
  url: string | null;
}

/**
 * 플랫폼에 글 발행 (공통 함수)
 * 모든 플랫폼을 동일한 시그니처로 호출
 */
export async function publish(
  platform: Platform,
  title: string,
  content: string,
): Promise<PublishResult> {
  switch (platform.type) {
    case 'BLOGSPOT': {
      const result = await publishBlogspot(platform.id, title, content);
      return { url: result.url ?? null };
    }
    case 'WORDPRESS': {
      const result = await publishWordpress(platform.id, title, content);
      return { url: result.url ?? null };
    }
    case 'NAVER': {
      const result = await publishNaverPost(title, content);
      return { url: result.url };
    }
    case 'TISTORY': {
      const creds = platform.credentials as Record<string, string> | null;
      const blogName = creds?.blogName;
      if (!blogName) {
        throw new Error('티스토리 블로그 이름이 설정되지 않았습니다. 사이트 설정에서 블로그 이름을 입력해주세요.');
      }
      const result = await publishTistoryPost(blogName, title, content);
      return { url: result.url };
    }
    default:
      throw new Error(`지원하지 않는 플랫폼: ${platform.type}`);
  }
}
