import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

/**
 * Google 자동완성 키워드 조회
 */
async function getGoogleSuggestions(keyword: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ko&q=${encodeURIComponent(keyword)}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const buf = await res.arrayBuffer();
    const text = new TextDecoder('euc-kr').decode(buf);
    const data = JSON.parse(text);
    return (data[1] || []) as string[];
  } catch {
    return [];
  }
}

/**
 * 네이버 자동완성 키워드 조회
 */
async function getNaverSuggestions(keyword: string): Promise<string[]> {
  try {
    const url = `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(keyword)}&q_enc=UTF-8&st=100&frm=nv&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&ans=2&run=2&rev=4`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const items = data.items?.[0] || [];
    return items.map((item: [string, string]) => item[0]);
  } catch {
    return [];
  }
}

// POST /api/keywords/suggest
// Google + 네이버 자동완성 키워드 조회
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { keyword } = body;

  if (!keyword) {
    return NextResponse.json(
      { error: '키워드는 필수입니다' },
      { status: 400 },
    );
  }

  const [google, naver] = await Promise.all([
    getGoogleSuggestions(keyword),
    getNaverSuggestions(keyword),
  ]);

  return NextResponse.json({
    success: true,
    keyword,
    google,
    naver,
  });
}
