import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

const GEMINI_IMAGEN_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict';

export interface ImageResult {
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  source: string;
  pageUrl: string;
}

interface GeminiImageOptions {
  keyword: string;
  apiKey: string;
  count?: number;
}

/**
 * Gemini Imagen API로 키워드 기반 이미지 생성
 */
export async function generateImages({
  keyword,
  apiKey,
  count = 2,
}: GeminiImageOptions): Promise<ImageResult[]> {
  if (!apiKey) {
    throw new Error('Gemini API Key가 설정되지 않았습니다.');
  }

  const prompt = `블로그 글에 어울리는 고품질 이미지: ${keyword}. 깔끔하고 전문적인 스타일.`;

  const res = await fetch(`${GEMINI_IMAGEN_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: Math.min(count, 4),
      },
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error?.error?.message || `Gemini Imagen API 호출 실패: HTTP ${res.status}`,
    );
  }

  const data = await res.json();
  const predictions = data.predictions || [];

  return predictions.map((pred: { bytesBase64Encoded: string; mimeType?: string }) => ({
    url: `data:${pred.mimeType || 'image/png'};base64,${pred.bytesBase64Encoded}`,
    thumbnail: `data:${pred.mimeType || 'image/png'};base64,${pred.bytesBase64Encoded}`,
    width: 1024,
    height: 1024,
    source: 'gemini',
    pageUrl: '',
  }));
}
