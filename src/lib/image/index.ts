import { searchImages as pixabaySearch, type ImageResult } from './pixabay';
import { searchImages as unsplashSearch } from './unsplash';

export type ImageSource = 'pixabay' | 'unsplash';
export type { ImageResult };

export interface SearchImagesOptions {
  source: ImageSource;
  keyword: string;
  apiKey: string;
  count?: number;
}

/**
 * 이미지 소스에 따라 적절한 모듈로 검색 요청을 분기
 */
export async function searchImages({
  source,
  keyword,
  apiKey,
  count,
}: SearchImagesOptions): Promise<ImageResult[]> {
  const options = { keyword, apiKey, count };

  switch (source) {
    case 'pixabay':
      return pixabaySearch(options);
    case 'unsplash':
      return unsplashSearch(options);
    default:
      throw new Error(`지원하지 않는 이미지 소스입니다: ${source}`);
  }
}
