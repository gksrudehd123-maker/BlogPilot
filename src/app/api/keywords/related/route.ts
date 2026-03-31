import { NextRequest, NextResponse } from 'next/server';
import { getRelatedKeywords } from '@/lib/keyword/naver-searchad';
import { prisma } from '@/lib/prisma';

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

// POST /api/keywords/related
// 네이버 검색광고 연관키워드 전체 조회
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { keyword } = body;

  if (!keyword) {
    return NextResponse.json(
      { error: '키워드는 필수입니다' },
      { status: 400 },
    );
  }

  try {
    const config = await getNaverAdConfig();

    if (!config.apiKey) {
      return NextResponse.json(
        { error: '네이버 검색광고 API가 설정되지 않았습니다.' },
        { status: 400 },
      );
    }

    const related = await getRelatedKeywords(keyword, config);

    return NextResponse.json({ success: true, keyword, related });
  } catch (err) {
    const message = err instanceof Error ? err.message : '연관키워드 조회에 실패했습니다';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
