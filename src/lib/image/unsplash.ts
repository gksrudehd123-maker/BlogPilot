const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

export interface ImageResult {
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  source: string;
  pageUrl: string;
}

interface UnsplashOptions {
  keyword: string;
  apiKey: string;
  count?: number;
}

/**
 * Unsplash API로 키워드 기반 이미지 검색
 */
export async function searchImages({
  keyword,
  apiKey,
  count = 8,
}: UnsplashOptions): Promise<ImageResult[]> {
  if (!apiKey) {
    throw new Error('Unsplash Access Key가 설정되지 않았습니다.');
  }

  const params = new URLSearchParams({
    query: keyword,
    per_page: String(Math.min(count, 20)),
    orientation: 'landscape',
  });

  const res = await fetch(`${UNSPLASH_API_URL}?${params}`, {
    headers: {
      Authorization: `Client-ID ${apiKey}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Unsplash API 호출 실패: HTTP ${res.status}`);
  }

  const data = await res.json();

  return (data.results || []).map((photo: {
    urls: { regular: string; thumb: string };
    width: number;
    height: number;
    links: { html: string };
  }) => ({
    url: photo.urls.regular,
    thumbnail: photo.urls.thumb,
    width: photo.width,
    height: photo.height,
    source: 'unsplash',
    pageUrl: photo.links.html,
  }));
}
