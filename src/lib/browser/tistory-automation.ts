import { type Page, type FrameLocator } from 'playwright';
import { createAuthenticatedContext, saveCookies } from './session-manager';

/**
 * 에디터 iframe 접근
 */
function getEditorFrame(page: Page): FrameLocator {
  return page.frameLocator('#editor-tistory_ifr');
}

/**
 * 제목 입력
 */
async function inputTitle(page: Page, title: string): Promise<void> {
  const titleInput = page.locator('#post-title-inp');
  await titleInput.waitFor({ state: 'visible', timeout: 10000 });
  await titleInput.click();
  await titleInput.fill(title);
  await page.waitForTimeout(300);
}

/**
 * 본문 입력 — HTML 모드로 전환 후 직접 입력
 * TinyMCE 에디터의 HTML 모드(CodeMirror)를 사용하면 HTML을 직접 넣을 수 있음
 */
async function inputContentViaHtmlMode(page: Page, content: string): Promise<void> {
  // "기본모드" 버튼 클릭 → 모드 선택 레이어 열기
  const modeBtn = page.locator('#editor-mode-layer-btn-open');
  await modeBtn.waitFor({ state: 'visible', timeout: 5000 });
  await modeBtn.click();
  await page.waitForTimeout(500);

  // "HTML" 모드 선택
  const htmlModeOption = page.locator('text=HTML');
  try {
    await htmlModeOption.waitFor({ state: 'visible', timeout: 3000 });
    await htmlModeOption.click();
    await page.waitForTimeout(1000);
  } catch {
    // HTML 옵션이 안 보이면 직접 찾기
    const modeOptions = page.locator('[class*="mode"] button, [class*="mode"] a, [class*="mode"] li');
    const count = await modeOptions.count();
    for (let i = 0; i < count; i++) {
      const text = await modeOptions.nth(i).textContent();
      if (text?.includes('HTML')) {
        await modeOptions.nth(i).click();
        await page.waitForTimeout(1000);
        break;
      }
    }
  }

  // 확인 다이얼로그가 뜨면 확인 클릭
  try {
    const confirmBtn = page.locator('button:has-text("확인")');
    if (await confirmBtn.isVisible({ timeout: 1500 })) {
      await confirmBtn.click();
      await page.waitForTimeout(500);
    }
  } catch {
    // 다이얼로그 없으면 무시
  }

  // CodeMirror 에디터에 HTML 입력
  const codeMirror = page.locator('.CodeMirror');
  await codeMirror.first().waitFor({ state: 'visible', timeout: 5000 });
  await codeMirror.first().click();
  await page.waitForTimeout(300);

  // CodeMirror에 setValue로 직접 입력
  await page.evaluate((html) => {
    const cm = document.querySelector('.CodeMirror') as HTMLElement & { CodeMirror?: { setValue: (v: string) => void } };
    if (cm?.CodeMirror) {
      cm.CodeMirror.setValue(html);
    }
  }, content);

  await page.waitForTimeout(500);

  // 다시 기본(WYSIWYG) 모드로 전환
  const modeBtn2 = page.locator('#editor-mode-layer-btn-open');
  await modeBtn2.click();
  await page.waitForTimeout(500);

  try {
    const basicModeOption = page.locator('text=기본모드');
    if (await basicModeOption.isVisible({ timeout: 2000 })) {
      await basicModeOption.click();
      await page.waitForTimeout(500);
    }
  } catch {
    // 무시
  }

  // 확인 다이얼로그
  try {
    const confirmBtn = page.locator('button:has-text("확인")');
    if (await confirmBtn.isVisible({ timeout: 1500 })) {
      await confirmBtn.click();
      await page.waitForTimeout(500);
    }
  } catch {
    // 무시
  }
}

/**
 * 본문 입력 — WYSIWYG iframe에 직접 입력 (fallback)
 */
async function inputContentViaIframe(page: Page, content: string): Promise<void> {
  const editorFrame = getEditorFrame(page);
  const body = editorFrame.locator('#editor-root, body');
  await body.waitFor({ state: 'visible', timeout: 10000 });
  await body.click();
  await page.waitForTimeout(300);

  // iframe 내부에 HTML 직접 삽입
  const frame = page.frame({ name: 'editor-tistory_ifr' });
  if (frame) {
    await frame.evaluate((html) => {
      const body = document.querySelector('#editor-root') || document.body;
      body.innerHTML = html;
    }, content);
  }
  await page.waitForTimeout(500);
}

/**
 * 완료(발행) 버튼 클릭 → 발행 설정 → 최종 발행
 */
async function clickPublish(page: Page): Promise<string | null> {
  // "완료" 버튼 클릭 → 발행 설정 레이어 열기
  const publishLayerBtn = page.locator('#publish-layer-btn');
  await publishLayerBtn.waitFor({ state: 'visible', timeout: 5000 });
  await publishLayerBtn.click();
  await page.waitForTimeout(1500);

  // 발행 설정 레이어에서 공개/비공개 선택 후 "발행" 클릭
  // 공개 설정이 기본이므로 바로 발행 버튼 클릭
  const confirmSelectors = [
    '#publish-btn',                    // 발행 확인 버튼
    'button.btn_ok:has-text("발행")',
    'button:has-text("공개발행")',
    '.layer_post button.btn_ok',
    '.btn_type1:has-text("발행")',
  ];

  for (const sel of confirmSelectors) {
    try {
      const btn = page.locator(sel);
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.click();
        await page.waitForTimeout(3000);
        break;
      }
    } catch {
      // 다음 셀렉터 시도
    }
  }

  // 발행 완료 후 URL 추출
  await page.waitForTimeout(3000);
  const currentUrl = page.url();

  // /manage/newpost가 아니면 발행 성공
  if (!currentUrl.includes('/manage/newpost')) {
    return currentUrl;
  }

  return null;
}

/**
 * 티스토리 블로그 글 발행
 * @param blogName 블로그 이름 (예: 'handongmoa')
 * @param dryRun true이면 제목/본문 입력까지만 하고 실제 발행은 하지 않음
 */
export async function publishTistoryPost(
  blogName: string,
  title: string,
  content: string,
  options?: { dryRun?: boolean; headless?: boolean },
): Promise<{ url: string | null; blogName: string }> {
  const { dryRun = false, headless } = options ?? {};
  const { browser, context } = await createAuthenticatedContext('tistory', headless);

  try {
    const page = await context.newPage();

    // 글쓰기 페이지 이동
    await page.goto(`https://${blogName}.tistory.com/manage/newpost`, {
      waitUntil: 'domcontentloaded',
    });

    // 로그인 리다이렉트 체크
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login') || currentUrl.includes('accounts.kakao.com')) {
      throw new Error('티스토리 세션이 만료되었습니다. 재로그인이 필요합니다.');
    }

    // 에디터 로딩 대기
    await page.waitForSelector('#post-title-inp', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // 제목 입력
    await inputTitle(page, title);

    // 본문 입력 (HTML 모드 시도 → 실패 시 iframe fallback)
    try {
      await inputContentViaHtmlMode(page, content);
    } catch {
      await inputContentViaIframe(page, content);
    }

    // dry run이면 스크린샷 찍고 종료
    if (dryRun) {
      await page.screenshot({ path: 'tistory-dryrun-screenshot.png', fullPage: true });
      const cookies = await context.cookies();
      await saveCookies('tistory', cookies);
      return { url: null, blogName };
    }

    // 발행
    const publishedUrl = await clickPublish(page);

    // 쿠키 갱신
    const cookies = await context.cookies();
    await saveCookies('tistory', cookies);

    return { url: publishedUrl, blogName };
  } finally {
    await browser.close();
  }
}

/**
 * 티스토리 연결 테스트
 */
export async function testTistoryConnection(blogName: string): Promise<{
  blogName: string;
  blogUrl: string;
}> {
  const { browser, context } = await createAuthenticatedContext('tistory');

  try {
    const page = await context.newPage();
    await page.goto(`https://${blogName}.tistory.com/manage`, {
      waitUntil: 'domcontentloaded',
    });

    const url = page.url();
    if (url.includes('/auth/login')) {
      throw new Error('티스토리 세션이 만료되었습니다. 재로그인이 필요합니다.');
    }

    return {
      blogName,
      blogUrl: `https://${blogName}.tistory.com`,
    };
  } finally {
    await browser.close();
  }
}
