import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';

export interface ImageResult {
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  source: string;
  pageUrl: string;
}

interface DalleOptions {
  keyword: string;
  apiKey: string;
  count?: number;
  model?: string;
  size?: string;
}

/**
 * DALL-E API로 키워드 기반 이미지 생성
 */
export async function generateImages({
  keyword,
  apiKey,
  count = 2,
  model = 'dall-e-3',
  size = '1024x1024',
}: DalleOptions): Promise<ImageResult[]> {
  if (!apiKey) {
    throw new Error('OpenAI API Key가 설정되지 않았습니다.');
  }

  const prompt = `블로그 글에 어울리는 고품질 이미지: ${keyword}. 깔끔하고 전문적인 스타일.`;

  // DALL-E 3는 한 번에 1장만 생성 가능
  const maxPerRequest = model === 'dall-e-3' ? 1 : Math.min(count, 5);
  const requests = model === 'dall-e-3' ? Math.min(count, 5) : 1;

  const results: ImageResult[] = [];

  for (let i = 0; i < requests; i++) {
    const res = await fetch(OPENAI_IMAGES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: maxPerRequest,
        size,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(
        error?.error?.message || `DALL-E API 호출 실패: HTTP ${res.status}`,
      );
    }

    const data = await res.json();
    const [w, h] = size.split('x').map(Number);

    for (const img of data.data || []) {
      results.push({
        url: img.url,
        thumbnail: img.url,
        width: w,
        height: h,
        source: 'dall-e',
        pageUrl: '',
      });
    }
  }

  return results;
}
