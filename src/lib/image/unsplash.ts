import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';

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
 * 한국어를 영어로 번역 (Google Translate 무료)
 */
async function translateToEnglish(text: string): Promise<string> {
  try {
    const url = `${TRANSLATE_URL}?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;

    const raw = await res.text();
    const data = JSON.parse(raw);
    return data?.[0]?.[0]?.[0] || text;
  } catch {
    return text;
  }
}

/**
 * Unsplash API 호출 헬퍼
 */
async function fetchUnsplash(query: string, apiKey: string, perPage: string): Promise<ImageResult[]> {
  const params = new URLSearchParams({
    query,
    per_page: perPage,
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

/**
 * Unsplash API로 키워드 기반 이미지 검색
 * 결과가 없으면 영어로 번역 후 재검색
 */
export async function searchImages({
  keyword,
  apiKey,
  count = 8,
}: UnsplashOptions): Promise<ImageResult[]> {
  if (!apiKey) {
    throw new Error('Unsplash Access Key가 설정되지 않았습니다.');
  }

  const perPage = String(Math.min(count, 20));

  // 먼저 원본 키워드로 검색
  let results = await fetchUnsplash(keyword, apiKey, perPage);

  // 결과가 없으면 영어로 번역 후 재검색
  if (results.length === 0) {
    const translated = await translateToEnglish(keyword);
    if (translated !== keyword) {
      results = await fetchUnsplash(translated, apiKey, perPage);
    }
  }

  return results;
}
