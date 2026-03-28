import { NextRequest, NextResponse } from 'next/server';

/**
 * 각 이미지 소스별 API 연결 테스트
 */
async function testSource(source: string, apiKey: string): Promise<void> {
  switch (source) {
    case 'pixabay': {
      const params = new URLSearchParams({
        key: apiKey,
        q: 'test',
        per_page: '1',
      });
      const res = await fetch(`https://pixabay.com/api/?${params}`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.message || `HTTP ${res.status}`);
      }
      break;
    }

    case 'unsplash': {
      const res = await fetch('https://api.unsplash.com/search/photos?query=test&per_page=1', {
        headers: { Authorization: `Client-ID ${apiKey}` },
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.errors?.[0] || `HTTP ${res.status}`);
      }
      break;
    }

    case 'ideogram': {
      // Ideogram API 연결 테스트 (기본 엔드포인트 확인)
      const res = await fetch('https://api.ideogram.ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
        },
        body: JSON.stringify({
          image_request: {
            prompt: 'test',
            model: 'V_2',
            magic_prompt_option: 'OFF',
          },
        }),
      });
      // 인증 실패가 아니면 OK
      if (res.status === 401 || res.status === 403) {
        throw new Error('API Key가 유효하지 않습니다');
      }
      break;
    }

    default:
      throw new Error(`연결 테스트를 지원하지 않는 소스입니다: ${source}`);
  }
}

// POST /api/images/test
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { source, apiKey } = body;

  if (!source || !apiKey) {
    return NextResponse.json(
      { error: 'source와 apiKey는 필수입니다' },
      { status: 400 },
    );
  }

  try {
    await testSource(source, apiKey);
    return NextResponse.json({ success: true, message: '연결 성공' });
  } catch (err) {
    const message = err instanceof Error ? err.message : '연결 테스트 실패';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
