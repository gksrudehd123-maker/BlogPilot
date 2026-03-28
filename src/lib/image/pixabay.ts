const PIXABAY_API_URL = 'https://pixabay.com/api/';

export interface ImageResult {
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  source: string;
  pageUrl: string;
}

interface PixabayOptions {
  keyword: string;
  apiKey: string;
  count?: number;
}

/**
 * Pixabay API로 키워드 기반 이미지 검색
 */
export async function searchImages({
  keyword,
  apiKey,
  count = 8,
}: PixabayOptions): Promise<ImageResult[]> {
  if (!apiKey) {
    throw new Error('Pixabay API Key가 설정되지 않았습니다.');
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: keyword,
    image_type: 'photo',
    per_page: String(Math.min(count, 20)),
    lang: 'ko',
    safesearch: 'true',
  });

  const res = await fetch(`${PIXABAY_API_URL}?${params}`);

  if (!res.ok) {
    throw new Error(`Pixabay API 호출 실패: HTTP ${res.status}`);
  }

  const data = await res.json();

  return (data.hits || []).map((hit: {
    webformatURL: string;
    previewURL: string;
    imageWidth: number;
    imageHeight: number;
    pageURL: string;
  }) => ({
    url: hit.webformatURL,
    thumbnail: hit.previewURL,
    width: hit.imageWidth,
    height: hit.imageHeight,
    source: 'pixabay',
    pageUrl: hit.pageURL,
  }));
}
