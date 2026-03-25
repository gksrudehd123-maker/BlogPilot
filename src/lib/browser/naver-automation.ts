import { type Page } from 'playwright';
import { createAuthenticatedContext, saveCookies } from './session-manager';

/**
 * 네이버 블로그 ID 자동 추출
 */
async function getBlogId(page: Page): Promise<string> {
  await page.goto('https://blog.naver.com/MyBlog.naver', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const url = page.url();
  const match = url.match(/blog\.naver\.com\/([^/?#]+)/);
  if (!match) {
    throw new Error('블로그 ID를 찾을 수 없습니다. 로그인 상태를 확인해주세요.');
  }
  return match[1];
}

/**
 * SmartEditor ONE에 제목 입력
 */
async function inputTitle(page: Page, title: string): Promise<void> {
  // 제목 영역 클릭
  const titleEl = page.locator('.se-title-text .se-text-paragraph');
  await titleEl.click();
  await page.waitForTimeout(300);

  // 기존 텍스트 전체 선택 후 삭제
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);

  // 제목 입력
  await page.keyboard.type(title, { delay: 30 });
  await page.waitForTimeout(300);
}

/**
 * SmartEditor ONE에 HTML 본문 입력
 *
 * SmartEditor ONE은 HTML 모드가 없으므로,
 * 본문 영역에 텍스트를 직접 입력하거나 클립보드를 통해 HTML을 붙여넣기합니다.
 * 여기서는 JavaScript로 에디터 내부에 HTML을 직접 삽입하는 방식을 사용합니다.
 */
async function inputContent(page: Page, content: string): Promise<void> {
  // 본문 영역 클릭 (제목 아래 텍스트 영역)
  const bodySection = page.locator('.se-section-text .se-text-paragraph').first();
  await bodySection.click();
  await page.waitForTimeout(500);

  // 본문 영역에 HTML 삽입 via clipboard
  // HTML을 클립보드에 복사하고 붙여넣기하면 SmartEditor가 서식을 유지함
  await page.evaluate(async (htmlContent) => {
    // ClipboardItem으로 HTML 형태의 클립보드 데이터 생성
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const clipboardItem = new ClipboardItem({ 'text/html': blob });
    await navigator.clipboard.write([clipboardItem]);
  }, content);

  // 붙여넣기
  await page.keyboard.press('Control+V');
  await page.waitForTimeout(1000);
}

/**
 * 본문 입력 (텍스트 기반 fallback)
 * HTML 클립보드가 동작하지 않을 경우 사용
 */
async function inputContentAsText(page: Page, content: string): Promise<void> {
  const bodySection = page.locator('.se-section-text .se-text-paragraph').first();
  await bodySection.click();
  await page.waitForTimeout(500);

  // HTML 태그를 제거하고 텍스트만 추출
  const textContent = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // 줄 단위로 입력 (Enter로 줄바꿈)
  const lines = textContent.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) {
      await page.keyboard.type(lines[i], { delay: 10 });
    }
    if (i < lines.length - 1) {
      await page.keyboard.press('Enter');
      // 빈 줄이면 추가 Enter (문단 구분)
      if (!lines[i].trim() && i > 0) {
        await page.waitForTimeout(50);
      }
    }
  }
  await page.waitForTimeout(500);
}

/**
 * 방해 요소 닫기 (도움말 패널 등)
 */
async function dismissOverlays(page: Page): Promise<void> {
  // 도움말 패널 닫기
  try {
    const helpCloseBtn = page.locator('button.se-help-panel-close-button');
    if (await helpCloseBtn.isVisible({ timeout: 1000 })) {
      await helpCloseBtn.click();
      await page.waitForTimeout(500);
    }
  } catch {
    // 도움말 패널이 없으면 무시
  }

  // 기타 오버레이/팝업 닫기
  try {
    const closeButtons = page.locator('[class*="close"]:visible, [class*="dismiss"]:visible');
    const count = await closeButtons.count();
    for (let i = 0; i < count; i++) {
      const btn = closeButtons.nth(i);
      const tag = await btn.evaluate(e => e.tagName);
      if (tag === 'BUTTON') {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }
  } catch {
    // 무시
  }
}

/**
 * 발행 버튼 클릭 → 발행 설정 다이얼로그 → 최종 발행
 */
async function clickPublish(page: Page): Promise<string | null> {
  // 방해 요소 닫기
  await dismissOverlays(page);

  // 상단 "발행" 버튼 클릭
  const publishBtn = page.locator('button.publish_btn__m9KHH');
  await publishBtn.waitFor({ state: 'visible', timeout: 5000 });
  await publishBtn.click({ force: true });
  await page.waitForTimeout(2000);

  // 발행 설정 팝업/다이얼로그가 뜨는 경우
  // "발행" 또는 "확인" 버튼을 찾아 클릭
  const confirmSelectors = [
    'button:has-text("발행")',  // 팝업 내 발행 버튼
    '.publish_layer button.confirm',
    '.publish_popup button.ok',
  ];

  for (const sel of confirmSelectors) {
    try {
      const confirmBtn = page.locator(sel).last();
      if (await confirmBtn.isVisible({ timeout: 2000 })) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);
        break;
      }
    } catch {
      // 다음 셀렉터 시도
    }
  }

  // 발행 완료 후 URL 추출
  // 발행 성공 시 글 페이지로 리다이렉트되거나 URL이 변경됨
  await page.waitForTimeout(3000);
  const currentUrl = page.url();

  // postwrite가 아닌 URL이면 발행 성공
  if (!currentUrl.includes('postwrite')) {
    return currentUrl;
  }

  // URL에서 글 번호 추출 시도
  return null;
}

/**
 * 네이버 블로그 글 발행
 * @param dryRun true이면 제목/본문 입력까지만 하고 실제 발행은 하지 않음 (테스트용)
 */
export async function publishNaverPost(
  title: string,
  content: string,
  options?: { dryRun?: boolean; headless?: boolean },
): Promise<{ url: string | null; blogId: string }> {
  const { dryRun = false, headless } = options ?? {};
  const { browser, context } = await createAuthenticatedContext('naver', headless);

  try {
    const page = await context.newPage();

    // 1. 블로그 ID 가져오기
    const blogId = await getBlogId(page);

    // 2. 글쓰기 페이지 이동
    await page.goto(`https://blog.naver.com/${blogId}/postwrite`, {
      waitUntil: 'domcontentloaded',
    });

    // 에디터 로딩 대기
    await page.waitForSelector('.se-title-text', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // 방해 요소 닫기
    await dismissOverlays(page);

    // 3. 제목 입력
    await inputTitle(page, title);

    // 4. 본문 입력 (HTML 클립보드 시도 → 실패 시 텍스트 fallback)
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await inputContent(page, content);

      // 본문이 입력되었는지 확인
      const bodyText = await page.locator('.se-section-text').textContent();
      if (!bodyText || bodyText.trim().length < 10) {
        throw new Error('HTML 붙여넣기 실패, 텍스트 모드로 재시도');
      }
    } catch {
      // Fallback: 텍스트로 입력
      await inputContentAsText(page, content);
    }

    // 5. dry run이면 여기서 스크린샷 찍고 종료
    if (dryRun) {
      await page.screenshot({ path: 'naver-dryrun-screenshot.png', fullPage: true });
      const cookies = await context.cookies();
      await saveCookies('naver', cookies);
      return { url: null, blogId };
    }

    // 6. 발행
    const publishedUrl = await clickPublish(page);

    // 7. 쿠키 갱신 (세션 유지)
    const cookies = await context.cookies();
    await saveCookies('naver', cookies);

    return { url: publishedUrl, blogId };
  } finally {
    await browser.close();
  }
}

/**
 * 네이버 블로그 연결 테스트
 * 로그인 상태 확인 + 블로그 ID 반환
 */
export async function testNaverConnection(): Promise<{
  blogId: string;
  blogUrl: string;
}> {
  const { browser, context } = await createAuthenticatedContext('naver');

  try {
    const page = await context.newPage();
    const blogId = await getBlogId(page);

    return {
      blogId,
      blogUrl: `https://blog.naver.com/${blogId}`,
    };
  } finally {
    await browser.close();
  }
}
