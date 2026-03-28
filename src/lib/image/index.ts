import { searchImages as pixabaySearch, type ImageResult } from './pixabay';
import { searchImages as unsplashSearch } from './unsplash';
import { generateImages as dalleGenerate } from './dalle';
import { generateImages as geminiGenerate } from './gemini';

export type ImageSource = 'pixabay' | 'unsplash' | 'dalle' | 'gemini_imagen';
export type { ImageResult };

export interface SearchImagesOptions {
  source: ImageSource;
  keyword: string;
  apiKey: string;
  count?: number;
  model?: string;
  size?: string;
}

/**
 * 이미지 소스에 따라 적절한 모듈로 검색/생성 요청을 분기
 */
export async function searchImages({
  source,
  keyword,
  apiKey,
  count,
  model,
  size,
}: SearchImagesOptions): Promise<ImageResult[]> {
  switch (source) {
    case 'pixabay':
      return pixabaySearch({ keyword, apiKey, count });
    case 'unsplash':
      return unsplashSearch({ keyword, apiKey, count });
    case 'dalle':
      return dalleGenerate({ keyword, apiKey, count, model, size });
    case 'gemini_imagen':
      return geminiGenerate({ keyword, apiKey, count });
    default:
      throw new Error(`지원하지 않는 이미지 소스입니다: ${source}`);
  }
}
