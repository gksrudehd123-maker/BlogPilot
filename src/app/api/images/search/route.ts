import { NextRequest, NextResponse } from 'next/server';
import { searchImages, type ImageSource } from '@/lib/image';
import { prisma } from '@/lib/prisma';

/**
 * DB에서 이미지 소스 설정을 조회 (enabled 여부와 관계없이 API Key 기준)
 */
async function getSourceConfig(sourceKey: string) {
  const settings = await prisma.setting.findMany({
    where: { key: { startsWith: `image_${sourceKey}_` } },
  });

  const map = new Map(settings.map((s) => [s.key, s.value]));

  const apiKey = map.get(`image_${sourceKey}_api_key`) || '';
  const count = parseInt(map.get(`image_${sourceKey}_count`) || '8');

  return { source: sourceKey as ImageSource, apiKey, count };
}

// POST /api/images/search
// 지정된 이미지 소스에서 키워드로 검색
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
        { error: `${source} API Key가 설정되지 않았습니다. 이미지 AI 설정에서 등록해주세요.` },
        { status: 400 },
      );
    }

    const images = await searchImages({
      source: config.source,
      keyword,
      apiKey: config.apiKey,
      count: count || config.count,
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
