import { type Platform } from '@prisma/client';
import { testConnection as testBlogspot } from './blogspot';
import { testConnection as testWordpress } from './wordpress';
import { testNaverConnection } from '@/lib/browser/naver-automation';
import { testTistoryConnection } from '@/lib/browser/tistory-automation';
import { checkSession } from '@/lib/browser/session-manager';

export interface TestResult {
  name: string;
  url: string;
}

/**
 * 플랫폼 연결 테스트 (공통 함수)
 */
export async function testConnection(
  platform: Platform,
): Promise<TestResult> {
  switch (platform.type) {
    case 'BLOGSPOT': {
      const result = await testBlogspot(platform.id);
      return { name: result.name ?? platform.name, url: result.url ?? '' };
    }
    case 'WORDPRESS': {
      const result = await testWordpress(platform.id);
      return { name: result.name ?? platform.name, url: result.url ?? '' };
    }
    case 'NAVER': {
      const session = await checkSession('naver');
      if (!session.valid) {
        throw new Error(session.message);
      }
      const result = await testNaverConnection();
      return { name: result.blogId, url: result.blogUrl };
    }
    case 'TISTORY': {
      const creds = platform.credentials as Record<string, string> | null;
      const blogName = creds?.blogName;
      if (!blogName) {
        throw new Error('블로그 이름이 설정되지 않았습니다.');
      }
      const session = await checkSession('tistory');
      if (!session.valid) {
        throw new Error(session.message);
      }
      const result = await testTistoryConnection(blogName);
      return { name: result.blogName, url: result.blogUrl };
    }
    default:
      throw new Error(`지원하지 않는 플랫폼: ${platform.type}`);
  }
}
