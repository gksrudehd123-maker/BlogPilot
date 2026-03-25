import { chromium, type BrowserContext, type Cookie } from 'playwright';
import fs from 'fs';
import path from 'path';

const COOKIES_DIR = path.join(process.cwd(), 'cookies');

// 쿠키 디렉토리 확보
function ensureCookiesDir() {
  if (!fs.existsSync(COOKIES_DIR)) {
    fs.mkdirSync(COOKIES_DIR, { recursive: true });
  }
}

/**
 * 플랫폼별 쿠키 파일 경로
 */
function getCookiePath(platform: 'naver' | 'tistory'): string {
  return path.join(COOKIES_DIR, `${platform}-session.json`);
}

/**
 * 쿠키 저장
 */
export async function saveCookies(
  platform: 'naver' | 'tistory',
  cookies: Cookie[],
): Promise<void> {
  ensureCookiesDir();
  const data = {
    platform,
    cookies,
    savedAt: new Date().toISOString(),
  };
  fs.writeFileSync(getCookiePath(platform), JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 쿠키 로드
 * 파일이 없거나 파싱 실패 시 null 반환
 */
export function loadCookies(platform: 'naver' | 'tistory'): Cookie[] | null {
  const filePath = getCookiePath(platform);
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return data.cookies as Cookie[];
  } catch {
    return null;
  }
}

/**
 * 쿠키 삭제
 */
export function deleteCookies(platform: 'naver' | 'tistory'): void {
  const filePath = getCookiePath(platform);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * 세션 유효성 체크
 * 저장된 쿠키로 해당 플랫폼에 로그인 상태인지 확인
 */
export async function checkSession(platform: 'naver' | 'tistory'): Promise<{
  valid: boolean;
  message: string;
}> {
  const cookies = loadCookies(platform);
  if (!cookies || cookies.length === 0) {
    return { valid: false, message: '저장된 세션이 없습니다. 브라우저 로그인이 필요합니다.' };
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    await context.addCookies(cookies);

    const page = await context.newPage();

    if (platform === 'naver') {
      await page.goto('https://blog.naver.com/MyBlog.naver', { waitUntil: 'domcontentloaded' });
      // 로그인 페이지로 리다이렉트되면 세션 만료
      const url = page.url();
      if (url.includes('nid.naver.com') || url.includes('login')) {
        return { valid: false, message: '네이버 세션이 만료되었습니다. 재로그인이 필요합니다.' };
      }
      return { valid: true, message: '네이버 로그인 상태 확인됨' };
    }

    if (platform === 'tistory') {
      // 관리 페이지 접근 → 로그인 안 되어 있으면 로그인 페이지로 리다이렉트
      await page.goto('https://www.tistory.com/manage', { waitUntil: 'domcontentloaded' });
      const url = page.url();
      if (url.includes('/auth/login') || url.includes('accounts.kakao.com')) {
        return { valid: false, message: '티스토리 세션이 만료되었습니다. 재로그인이 필요합니다.' };
      }
      return { valid: true, message: '티스토리 로그인 상태 확인됨' };
    }

    return { valid: false, message: '알 수 없는 플랫폼' };
  } catch (error) {
    return {
      valid: false,
      message: `세션 확인 실패: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await browser?.close();
  }
}

/**
 * 수동 로그인 브라우저 띄우기
 * headful 모드로 브라우저를 열어 사용자가 직접 로그인하도록 함.
 * 로그인 완료 감지 후 쿠키를 자동 저장하고 브라우저를 닫음.
 * @param blogName 티스토리 전용 — 로그인 후 서브도메인 쿠키 확보를 위해 블로그 이름 필요
 */
export async function openLoginBrowser(platform: 'naver' | 'tistory', blogName?: string): Promise<{
  success: boolean;
  message: string;
}> {
  let browser;
  try {
    browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized'],
    });

    const context = await browser.newContext({
      viewport: null, // 최대화된 창 크기 사용
    });

    const page = await context.newPage();

    if (platform === 'naver') {
      await page.goto('https://nid.naver.com/nidlogin.login');

      // 네이버 로그인 완료 감지: 로그인 후 리다이렉트를 기다림
      await page.waitForURL(
        (url) => !url.href.includes('nid.naver.com') && !url.href.includes('nidlogin'),
        { timeout: 300000 }, // 5분 대기
      );
    } else if (platform === 'tistory') {
      // 블로그 관리 페이지로 직접 이동 → 미로그인 시 카카오 로그인 리다이렉트
      // 이렇게 하면 로그인 완료 후 서브도메인으로 돌아오면서 인증 쿠키가 자동 생성됨
      const manageUrl = blogName
        ? `https://${blogName}.tistory.com/manage`
        : 'https://www.tistory.com/auth/login';

      await page.goto(manageUrl, { waitUntil: 'domcontentloaded' });

      // 카카오 로그인 완료 감지: 로그인 페이지/카카오 인증 페이지가 아닌 URL 대기
      await page.waitForURL(
        (url) =>
          !url.href.includes('/auth/login') &&
          !url.href.includes('accounts.kakao.com') &&
          !url.href.includes('kauth.kakao.com'),
        { timeout: 300000 },
      );

      // 로그인 완료 후 관리 페이지 로딩 대기
      await page.waitForTimeout(3000);
    }

    // 로그인 완료 → 잠시 대기 후 쿠키 저장
    // 모든 도메인의 쿠키를 수집 (서브도메인 포함)
    await page.waitForTimeout(2000);
    const cookies = await context.cookies();
    await saveCookies(platform, cookies);

    await browser.close();

    return {
      success: true,
      message: `${platform === 'naver' ? '네이버' : '티스토리'} 로그인 완료, 세션 저장됨`,
    };
  } catch (error) {
    await browser?.close();

    if (error instanceof Error && error.message.includes('Target page, context or browser has been closed')) {
      return { success: false, message: '브라우저가 닫혔습니다. 다시 시도해주세요.' };
    }
    if (error instanceof Error && error.message.includes('Timeout')) {
      return { success: false, message: '로그인 대기 시간(5분)이 초과되었습니다. 다시 시도해주세요.' };
    }

    return {
      success: false,
      message: `로그인 실패: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * 저장된 쿠키로 브라우저 컨텍스트 생성 (발행 시 사용)
 * @param headless undefined이면 기본 true, false이면 브라우저 창 표시
 */
export async function createAuthenticatedContext(
  platform: 'naver' | 'tistory',
  headless?: boolean,
): Promise<{ browser: ReturnType<typeof chromium.launch> extends Promise<infer T> ? T : never; context: BrowserContext }> {
  const cookies = loadCookies(platform);
  if (!cookies || cookies.length === 0) {
    throw new Error(`${platform} 세션이 없습니다. 먼저 브라우저 로그인을 해주세요.`);
  }

  const browser = await chromium.launch({ headless: headless ?? true });
  const context = await browser.newContext();
  await context.addCookies(cookies);

  return { browser, context };
}
