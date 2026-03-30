import { NextRequest, NextResponse } from 'next/server';
import { getKeywordVolumes } from '@/lib/keyword/naver-searchad';
import { prisma } from '@/lib/prisma';

/**
 * DB에서 네이버 검색광고 API 설정 조회
 */
async function getNaverAdConfig() {
  const settings = await prisma.setting.findMany({
    where: {
      key: { in: ['naver_ad_api_key', 'naver_ad_secret_key', 'naver_ad_customer_id'] },
    },
  });

  const map = new Map(settings.map((s) => [s.key, s.value]));

  return {
    apiKey: map.get('naver_ad_api_key') || '',
    secretKey: map.get('naver_ad_secret_key') || '',
    customerId: map.get('naver_ad_customer_id') || '',
  };
}

// POST /api/keywords/search-volume
// 키워드 검색량 조회 + DB 업데이트
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { keywords } = body as { keywords: string[] };

  if (!keywords || keywords.length === 0) {
    return NextResponse.json(
      { error: '키워드는 필수입니다' },
      { status: 400 },
    );
  }

  try {
    const config = await getNaverAdConfig();

    if (!config.apiKey) {
      return NextResponse.json(
        { error: '네이버 검색광고 API가 설정되지 않았습니다. 설정 페이지에서 등록해주세요.' },
        { status: 400 },
      );
    }

    const volumes = await getKeywordVolumes(keywords, config);

    // 입력 키워드 → 조회 결과 매핑
    const volumeMap = new Map(volumes.map((v) => [v.keyword.toLowerCase(), v]));

    let updatedCount = 0;
    for (const kw of keywords) {
      const vol = volumeMap.get(kw.toLowerCase());
      if (vol) {
        await prisma.keyword.updateMany({
          where: { keyword: kw },
          data: {
            searchVolume: vol.totalSearchVolume,
            pcSearchVolume: vol.pcSearchVolume,
            mobileSearchVolume: vol.mobileSearchVolume,
            competition: vol.competition,
          },
        });
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, volumes, updated: updatedCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : '검색량 조회에 실패했습니다';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
