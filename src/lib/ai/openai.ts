import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface GenerateOptions {
  keyword: string;
  prompt: string;
  tone?: string;
  length?: number;
  model?: string;
  apiKey?: string;
}

/**
 * OpenAI API로 블로그 글 생성
 * 프롬프트의 {keyword}, {tone}, {length} 변수를 치환 후 호출
 */
export async function generatePost({
  keyword,
  prompt,
  tone = '친근한',
  length = 1500,
  model = 'gpt-4o',
  apiKey,
}: GenerateOptions): Promise<string> {
  const key = apiKey || process.env.OPENAI_API_KEY;

  if (!key) {
    throw new Error('OpenAI API Key가 설정되지 않았습니다.');
  }

  const filledPrompt = prompt
    .replace(/\{keyword\}/g, keyword)
    .replace(/\{tone\}/g, tone)
    .replace(/\{length\}/g, String(length));

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: filledPrompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error?.error?.message || `OpenAI API 호출 실패: HTTP ${res.status}`,
    );
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI API에서 응답을 받지 못했습니다');
  }

  return content;
}
