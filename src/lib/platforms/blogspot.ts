import { google } from 'googleapis';
import { getOAuth2Client, refreshAccessToken } from '@/lib/google-oauth';
import { prisma } from '@/lib/prisma';

interface BlogspotCredentials {
  blogId: string;
  accessToken: string;
  refreshToken: string;
  expiryDate?: number;
  label?: string;
}

/**
 * 인증된 Blogger API 클라이언트 생성
 * 토큰 만료 시 자동 갱신
 */
async function getBloggerClient(platformId: string) {
  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
  });

  if (!platform || !platform.credentials) {
    throw new Error('플랫폼 계정을 찾을 수 없습니다');
  }

  const creds = platform.credentials as unknown as BlogspotCredentials;

  if (!creds.accessToken || !creds.refreshToken) {
    throw new Error('Google 계정이 연동되지 않았습니다. 먼저 Google 계정 연동을 해주세요.');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: creds.accessToken,
    refresh_token: creds.refreshToken,
    expiry_date: creds.expiryDate,
  });

  // 토큰 만료 확인 → 갱신
  const now = Date.now();
  if (creds.expiryDate && creds.expiryDate < now + 60000) {
    const newCredentials = await refreshAccessToken(creds.refreshToken);

    await prisma.platform.update({
      where: { id: platformId },
      data: {
        credentials: {
          ...creds,
          accessToken: newCredentials.access_token,
          expiryDate: newCredentials.expiry_date,
        },
      },
    });

    oauth2Client.setCredentials(newCredentials);
  }

  return {
    blogger: google.blogger({ version: 'v3', auth: oauth2Client }),
    blogId: creds.blogId,
  };
}

/**
 * 글 발행
 */
export async function publishPost(
  platformId: string,
  title: string,
  content: string,
  labels?: string[],
) {
  const { blogger, blogId } = await getBloggerClient(platformId);

  const res = await blogger.posts.insert({
    blogId,
    requestBody: {
      title,
      content,
      labels,
    },
  });

  return {
    url: res.data.url,
    postId: res.data.id,
  };
}

/**
 * 연결테스트 — 블로그 정보 조회
 */
export async function testConnection(platformId: string) {
  const { blogger, blogId } = await getBloggerClient(platformId);

  const res = await blogger.blogs.get({ blogId });

  return {
    name: res.data.name,
    url: res.data.url,
    posts: res.data.posts?.totalItems ?? 0,
  };
}
