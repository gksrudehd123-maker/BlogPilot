import { NextRequest, NextResponse } from 'next/server';
import { generatePost, type AIProvider } from '@/lib/ai';
import { prisma } from '@/lib/prisma';

/**
 * DB Setting에서 AI 관련 설정을 조회
 */
async function getAISettings(provider?: string) {
  const settings = await prisma.setting.findMany({
    where: {
      key: { startsWith: 'ai_' },
    },
  });

  const map = new Map(settings.map((s) => [s.key, s.value]));

  const resolvedProvider = (provider || map.get('ai_default_provider') || 'claude') as AIProvider;

  return {
    provider: resolvedProvider,
    apiKey: map.get(`ai_api_key_${resolvedProvider}`) || undefined,
    model: map.get(`ai_model_${resolvedProvider}`) || undefined,
  };
}

// POST /api/posts/generate
// AI 글 생성 (멀티 AI 제공자 지원)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { keyword, prompt, systemPrompt, tone, length, model, provider } = body;

  if (!keyword || !prompt) {
    return NextResponse.json(
      { error: '키워드와 프롬프트는 필수입니다' },
      { status: 400 },
    );
  }

  try {
    const aiSettings = await getAISettings(provider);

    const content = await generatePost({
      provider: aiSettings.provider,
      keyword,
      prompt,
      systemPrompt,
      tone,
      length,
      model: model || aiSettings.model,
      apiKey: aiSettings.apiKey,
    });

    return NextResponse.json({
      success: true,
      content,
      provider: aiSettings.provider,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '글 생성에 실패했습니다';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
