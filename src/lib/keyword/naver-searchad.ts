import crypto from 'crypto';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

const API_URL = 'https://api.searchad.naver.com/keywordstool';

interface NaverSearchAdConfig {
  apiKey: string;
  secretKey: string;
  customerId: string;
}

export interface KeywordVolume {
  keyword: string;
  pcSearchVolume: number;
  mobileSearchVolume: number;
  totalSearchVolume: number;
  competition: string;
}

/**
 * HMAC-SHA256 서명 생성
 */
function generateSignature(timestamp: string, method: string, path: string, secretKey: string): string {
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(`${timestamp}.${method}.${path}`);
  return hmac.digest('base64');
}

/**
 * 네이버 검색광고 API로 키워드 검색량 조회
 */
export async function getKeywordVolumes(
  keywords: string[],
  config: NaverSearchAdConfig,
): Promise<KeywordVolume[]> {
  const { apiKey, secretKey, customerId } = config;

  if (!apiKey || !secretKey || !customerId) {
    throw new Error('네이버 검색광고 API 설정이 필요합니다.');
  }

  const method = 'GET';
  const path = '/keywordstool';

  const results: KeywordVolume[] = [];

  // 키워드별 개별 호출
  for (const kw of keywords) {
    try {
      // 공백 있는 키워드는 공백 제거 버전도 시도
      const variants = [kw];
      if (kw.includes(' ')) {
        variants.push(kw.replace(/\s+/g, ''));
      }

      let found = false;
      for (const variant of variants) {
        if (found) break;

        const ts = String(Date.now());
        const sig = generateSignature(ts, method, path, secretKey);
        const url = `${API_URL}?hintKeywords=${encodeURIComponent(variant)}&showDetail=1`;

        const res = await fetch(url, {
          headers: {
            'X-Timestamp': ts,
            'X-API-KEY': apiKey,
            'X-Customer': customerId,
            'X-Signature': sig,
          },
        });

        if (!res.ok) continue;

        const data = await res.json();
        const list = data.keywordList || [];

        if (list.length > 0) {
          const item = list[0];
          const pc = typeof item.monthlyPcQcCnt === 'number' ? item.monthlyPcQcCnt : 0;
          const mobile = typeof item.monthlyMobileQcCnt === 'number' ? item.monthlyMobileQcCnt : 0;

          results.push({
            keyword: kw,
            pcSearchVolume: pc,
            mobileSearchVolume: mobile,
            totalSearchVolume: pc + mobile,
            competition: item.compIdx || '알수없음',
          });
          found = true;
        }
      }
    } catch {
      // 개별 키워드 실패 시 건너뜀
    }
  }

  return results;
}
