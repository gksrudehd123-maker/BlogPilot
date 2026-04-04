import { generatePost as claudeGenerate } from './claude';
import { generatePost as openaiGenerate } from './openai';
import { generatePost as geminiGenerate } from './gemini';

export type AIProvider = 'claude' | 'openai' | 'gemini';
export type GenerateMode = 'keyword' | 'reference';

export interface GeneratePostOptions {
  provider: AIProvider;
  keyword: string;
  prompt: string;
  systemPrompt?: string;
  tone?: string;
  length?: number;
  model?: string;
  apiKey?: string;
  mode?: GenerateMode;
  referenceContent?: string;
}

/**
 * 참고 글 기반 프롬프트 조합
 * 참고 글의 구조를 분석하여 새로운 주제로 완전히 새로운 글을 생성하는 프롬프트
 */
export function buildReferencePrompt(
  referenceContent: string,
  keyword?: string,
  tone?: string,
  length?: number,
  additionalPrompt?: string,
): { system: string; user: string } {
  const system = `당신은 블로그 글 구조 분석 및 콘텐츠 제작 전문가입니다.
참고 글의 구조(소제목 수, 단락 흐름, 글 길이, 형식, 문단 구성)를 정밀하게 분석하고,
그 구조를 유지하면서 완전히 새로운 글을 작성합니다.
반드시 HTML 형식으로 출력하세요.`;

  const topicLine = keyword
    ? `"${keyword}" 주제로`
    : '참고 글과 유사한 카테고리에서 새로운 주제를 선정하여';

  const toneLine = tone ? `\n- 톤: ${tone}` : '';
  const lengthLine = length ? `\n- 글자수: 약 ${length}자 내외` : '\n- 글자수: 참고 글과 비슷한 분량';

  const additionalLine = additionalPrompt
    ? `\n\n## 추가 지시사항\n${additionalPrompt.replace(/\{keyword\}/g, keyword || '').replace(/\{tone\}/g, tone || '친근한').replace(/\{length\}/g, String(length || 1500))}`
    : '';

  const user = `아래 참고 글의 구조를 분석하고, ${topicLine} 완전히 새로운 블로그 글을 작성해주세요.

## 규칙
- 참고 글의 소제목 개수, 단락 흐름, 글 구성 방식을 유지할 것
- 참고 글의 문장이나 표현을 절대 그대로 사용하지 말 것
- 새 글은 독창적인 내용으로 작성할 것${toneLine}${lengthLine}
- HTML 형식으로 출력 (h1 제목 포함)${additionalLine}

## 참고 글
${referenceContent}`;

  return { system, user };
}

/**
 * AI 제공자에 따라 적절한 모듈로 글 생성 요청을 분기
 */
export async function generatePost({
  provider,
  keyword,
  prompt,
  systemPrompt,
  tone,
  length,
  model,
  apiKey,
  mode = 'keyword',
  referenceContent,
}: GeneratePostOptions): Promise<string> {
  let options;

  if (mode === 'reference' && referenceContent) {
    const refPrompt = buildReferencePrompt(referenceContent, keyword, tone, length, prompt || undefined);
    const mergedSystem = systemPrompt
      ? `${refPrompt.system}\n\n${systemPrompt}`
      : refPrompt.system;
    options = {
      keyword: keyword || '참고 글 기반',
      prompt: refPrompt.user,
      systemPrompt: mergedSystem,
      tone,
      length,
      model,
      apiKey,
    };
  } else {
    options = { keyword, prompt, systemPrompt, tone, length, model, apiKey };
  }

  switch (provider) {
    case 'claude':
      return claudeGenerate(options);
    case 'openai':
      return openaiGenerate(options);
    case 'gemini':
      return geminiGenerate(options);
    default:
      throw new Error(`지원하지 않는 AI 제공자입니다: ${provider}`);
  }
}
