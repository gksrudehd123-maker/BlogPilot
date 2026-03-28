import { NextRequest, NextResponse } from 'next/server';
import { searchImages, type ImageSource } from '@/lib/image';
import { prisma } from '@/lib/prisma';

/**
 * DB에서 이미지 소스 설정을 조회
 * DALL-E/Gemini는 글쓰기 AI 설정의 키를 재활용
 */
async function getSourceConfig(sourceKey: string) {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          `image_${sourceKey}_api_key`,
          `image_${sourceKey}_count`,
          `image_${sourceKey}_model`,
          `image_${sourceKey}_size`,
          // AI 설정 키 (DALL-E/Gemini 재활용)
          'ai_api_key_openai',
          'ai_api_key_gemini',
        ],
      },
    },
  });

  const map = new Map(settings.map((s) => [s.key, s.value]));

  // DALL-E는 OpenAI 키, Gemini Imagen은 Gemini 키 재활용
  let apiKey = map.get(`image_${sourceKey}_api_key`) || '';
  if (!apiKey && sourceKey === 'dalle') {
    apiKey = map.get('ai_api_key_openai') || '';
  }
  if (!apiKey && sourceKey === 'gemini_imagen') {
    apiKey = map.get('ai_api_key_gemini') || '';
  }

  const count = parseInt(map.get(`image_${sourceKey}_count`) || (sourceKey === 'dalle' ? '2' : '8'));
  const model = map.get(`image_${sourceKey}_model`) || undefined;
  const size = map.get(`image_${sourceKey}_size`) || undefined;

  return { source: sourceKey as ImageSource, apiKey, count, model, size };
}

// POST /api/images/search
// 지정된 이미지 소스에서 키워드로 검색/생성
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { keyword, source, count } = body;

  if (!keyword) {
    return NextResponse.json(
      { error: '키워드는 필수입니다' },
      { status: 400 },
    );
  }

  if (!source) {
    return NextResponse.json(
      { error: '이미지 소스를 선택해주세요' },
      { status: 400 },
    );
  }

  try {
    const config = await getSourceConfig(source);

    if (!config.apiKey) {
      return NextResponse.json(
        { error: `${source} API Key가 설정되지 않았습니다.` },
        { status: 400 },
      );
    }

    const images = await searchImages({
      source: config.source,
      keyword,
      apiKey: config.apiKey,
      count: count || config.count,
      model: config.model,
      size: config.size,
    });

    return NextResponse.json({ success: true, images, source });
  } catch (err) {
    const message = err instanceof Error ? err.message : '이미지 검색에 실패했습니다';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
