import https from 'https';
import { prisma } from '@/lib/prisma';

// SSL 인증서 문제가 있는 사이트를 위한 에이전트 (개발 환경용)
const agent = new https.Agent({ rejectUnauthorized: false });

function wpFetch(url: string, options: RequestInit = {}) {
  return fetch(url, { ...options, ...(url.startsWith('https') ? { agent } : {}) } as never);
}

interface WordPressCredentials {
  siteUrl: string;
  username: string;
  password: string;
  category?: string;
}

function getCredentials(platformId: string) {
  return prisma.platform.findUnique({ where: { id: platformId } }).then((p) => {
    if (!p || !p.credentials) {
      throw new Error('플랫폼 계정을 찾을 수 없습니다');
    }
    const creds = p.credentials as unknown as WordPressCredentials;
    if (!creds.siteUrl || !creds.username || !creds.password) {
      throw new Error('사이트 URL, 사용자명, Application Password를 모두 입력해주세요.');
    }
    return creds;
  });
}

function getAuthHeader(username: string, password: string) {
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${token}`;
}

/**
 * 글 발행
 */
export async function publishPost(
  platformId: string,
  title: string,
  content: string,
) {
  const creds = await getCredentials(platformId);
  const siteUrl = creds.siteUrl.replace(/\/+$/, '');

  const res = await wpFetch(`${siteUrl}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(creds.username, creds.password),
    },
    body: JSON.stringify({
      title,
      content,
      status: 'publish',
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || `발행 실패: HTTP ${res.status}`);
  }

  const post = await res.json();

  return {
    url: post.link,
    postId: String(post.id),
  };
}

/**
 * 연결테스트 — 사이트 정보 + 인증 확인
 */
export async function testConnection(platformId: string) {
  const creds = await getCredentials(platformId);
  const siteUrl = creds.siteUrl.replace(/\/+$/, '');

  // 사용자 인증 확인 (me 엔드포인트)
  const res = await wpFetch(`${siteUrl}/wp-json/wp/v2/users/me`, {
    headers: {
      Authorization: getAuthHeader(creds.username, creds.password),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('인증 실패: 사용자명 또는 Application Password를 확인해주세요.');
    }
    throw new Error(`연결 실패: HTTP ${res.status}`);
  }

  const user = await res.json();

  // 사이트 정보 조회
  const siteRes = await wpFetch(`${siteUrl}/wp-json`);
  const siteInfo = await siteRes.json();

  return {
    name: siteInfo.name || siteUrl,
    url: siteInfo.url || siteUrl,
    user: user.name || creds.username,
  };
}
