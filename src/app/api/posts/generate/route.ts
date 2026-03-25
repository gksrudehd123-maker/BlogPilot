import { NextRequest, NextResponse } from 'next/server';
import { generatePost } from '@/lib/ai/claude';

// POST /api/posts/generate
// AI 글 생성
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { keyword, prompt, tone, length, model } = body;

  if (!keyword || !prompt) {
    return NextResponse.json(
      { error: '키워드와 프롬프트는 필수입니다' },
      { status: 400 },
    );
  }

  try {
    const content = await generatePost({
      keyword,
      prompt,
      tone,
      length,
      model,
    });

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '글 생성에 실패했습니다';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
