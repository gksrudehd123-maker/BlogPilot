import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

type Provider = 'claude' | 'openai' | 'gemini';

/**
 * 각 AI 제공자별 간단한 API 호출로 키 유효성 검증
 */
async function testProvider(provider: Provider, apiKey: string): Promise<void> {
  switch (provider) {
    case 'claude': {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error?.message || `HTTP ${res.status}`);
      }
      break;
    }

    case 'openai': {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error?.message || `HTTP ${res.status}`);
      }
      break;
    }

    case 'gemini': {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hi' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        },
      );
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error?.message || `HTTP ${res.status}`);
      }
      break;
    }

    default:
      throw new Error(`지원하지 않는 AI 제공자: ${provider}`);
  }
}

// POST /api/ai/test
// AI API Key 연결 테스트
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { provider, apiKey } = body;

  if (!provider || !apiKey) {
    return NextResponse.json(
      { error: 'provider와 apiKey는 필수입니다' },
      { status: 400 },
    );
  }

  try {
    await testProvider(provider, apiKey);
    return NextResponse.json({ success: true, message: '연결 성공' });
  } catch (err) {
    const message = err instanceof Error ? err.message : '연결 테스트 실패';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
