import { generatePost as claudeGenerate } from './claude';
import { generatePost as openaiGenerate } from './openai';
import { generatePost as geminiGenerate } from './gemini';

export type AIProvider = 'claude' | 'openai' | 'gemini';

export interface GeneratePostOptions {
  provider: AIProvider;
  keyword: string;
  prompt: string;
  systemPrompt?: string;
  tone?: string;
  length?: number;
  model?: string;
  apiKey?: string;
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
}: GeneratePostOptions): Promise<string> {
  const options = { keyword, prompt, systemPrompt, tone, length, model, apiKey };

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
