import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GenerateOptions {
  keyword: string;
  prompt: string;
  tone?: string;
  length?: number;
  model?: string;
  apiKey?: string;
}

/**
 * Google Gemini API로 블로그 글 생성
 * 프롬프트의 {keyword}, {tone}, {length} 변수를 치환 후 호출
 */
export async function generatePost({
  keyword,
  prompt,
  tone = '친근한',
  length = 1500,
  model = 'gemini-2.5-flash',

  apiKey,
}: GenerateOptions): Promise<string> {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error('Gemini API Key가 설정되지 않았습니다.');
  }

  const filledPrompt = prompt
    .replace(/\{keyword\}/g, keyword)
    .replace(/\{tone\}/g, tone)
    .replace(/\{length\}/g, String(length));

  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: filledPrompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error?.error?.message || `Gemini API 호출 실패: HTTP ${res.status}`,
    );
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('Gemini API에서 응답을 받지 못했습니다');
  }

  return content;
}
