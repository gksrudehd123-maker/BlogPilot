import dns from 'dns';

// Node.js가 IPv6를 우선 시도하면서 실패하는 문제 해결
dns.setDefaultResultOrder('ipv4first');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface GenerateOptions {
  keyword: string;
  prompt: string;
  tone?: string;
  length?: number;
  model?: string;
}

/**
 * Claude API로 블로그 글 생성
 * 프롬프트의 {keyword}, {tone}, {length} 변수를 치환 후 호출
 */
export async function generatePost({
  keyword,
  prompt,
  tone = '친근한',
  length = 1500,
  model = 'claude-sonnet-4-20250514',
}: GenerateOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  }

  // 프롬프트 변수 치환
  const filledPrompt = prompt
    .replace(/\{keyword\}/g, keyword)
    .replace(/\{tone\}/g, tone)
    .replace(/\{length\}/g, String(length));

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
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
      error?.error?.message || `Claude API 호출 실패: HTTP ${res.status}`,
    );
  }

  const data = await res.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error('Claude API에서 응답을 받지 못했습니다');
  }

  return content;
}
