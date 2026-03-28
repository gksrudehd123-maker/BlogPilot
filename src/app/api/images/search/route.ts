import { NextRequest, NextResponse } from 'next/server';
import { searchImages, type ImageSource } from '@/lib/image';
import { prisma } from '@/lib/prisma';

/**
 * DB에서 활성화된 이미지 소스의 설정을 조회
 */
async function getImageSettings() {
  const settings = await prisma.setting.findMany({
    where: { key: { startsWith: 'image_' } },
  });

  const map = new Map(settings.map((s) => [s.key, s.value]));

  const sources: { source: ImageSource; apiKey: string; count: number }[] = [];

  // Pixabay
  if (map.get('image_pixabay_enabled') === 'true') {
    sources.push({
      source: 'pixabay',
      apiKey: map.get('image_pixabay_api_key') || '',
      count: parseInt(map.get('image_pixabay_count') || '8'),
    });
  }

  // Unsplash
  if (map.get('image_unsplash_enabled') === 'true') {
    sources.push({
      source: 'unsplash',
      apiKey: map.get('image_unsplash_api_key') || '',
      count: parseInt(map.get('image_unsplash_count') || '8'),
    });
  }

  return sources;
}

// POST /api/images/search
// 활성화된 이미지 소스에서 키워드로 검색
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { keyword, source, count } = body;

  if (!keyword) {
    return NextResponse.json(
      { error: '키워드는 필수입니다' },
      { status: 400 },
    );
  }

  try {
    // 특정 소스가 지정된 경우
    if (source) {
      const settings = await getImageSettings();
      const config = settings.find((s) => s.source === source);
      if (!config) {
        return NextResponse.json(
          { error: `${source}가 활성화되지 않았습니다. 이미지 AI 설정을 확인해주세요.` },
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
    }

    // 소스 미지정 → 활성화된 첫 번째 소스 사용
    const settings = await getImageSettings();
    if (settings.length === 0) {
      return NextResponse.json(
        { error: '활성화된 이미지 소스가 없습니다. 이미지 AI 설정에서 소스를 활성화해주세요.' },
        { status: 400 },
      );
    }

    const config = settings[0];
    const images = await searchImages({
      source: config.source,
      keyword,
      apiKey: config.apiKey,
      count: count || config.count,
    });

    return NextResponse.json({ success: true, images, source: config.source });
  } catch (err) {
    const message = err instanceof Error ? err.message : '이미지 검색에 실패했습니다';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
