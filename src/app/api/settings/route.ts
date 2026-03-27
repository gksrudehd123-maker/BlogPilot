import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/settings — 전체 설정 조회 (또는 ?key=xxx로 단일 조회)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (key) {
    const setting = await prisma.setting.findUnique({ where: { key } });
    return NextResponse.json({ key, value: setting?.value ?? null });
  }

  const settings = await prisma.setting.findMany();
  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return NextResponse.json(result);
}

// PUT /api/settings — 설정 저장 (여러 키 한번에)
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const entries = body as Record<string, string>;

  for (const [key, value] of Object.entries(entries)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  return NextResponse.json({ success: true });
}
