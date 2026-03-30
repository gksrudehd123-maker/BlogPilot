'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Send, ChevronDown, Copy, Check, Save, List, PenLine, Bot, Eye, Code, FileText } from 'lucide-react';
import { toast } from 'sonner';
import TurndownService from 'turndown';
import { marked } from 'marked';

type AIProviderOption = {
  key: string;
  label: string;
  icon: string;
};

const AI_PROVIDERS: AIProviderOption[] = [
  { key: 'claude', label: '클로드', icon: '🟤' },
  { key: 'openai', label: '오픈AI', icon: '🤖' },
  { key: 'gemini', label: '제미나이', icon: '💎' },
];

interface Platform {
  id: string;
  type: string;
  name: string;
  credentials: Record<string, string> | null;
}

type Prompt = {
  id: string;
  name: string;
  systemPrompt?: string;
  content: string;
};

const fallbackPrompts: Prompt[] = [
  {
    id: '1',
    name: '기본 블로그 글',
    content: '{keyword}을(를) 주제로 {tone} 톤의 블로그 글을 {length}자 내외로 작성해줘. 소제목을 포함하고 HTML 형식으로 출력해줘.',
  },
  {
    id: '2',
    name: '리뷰 글',
    content: '{keyword}에 대한 상세 리뷰를 작성해줘. 장점, 단점, 총평을 포함하고 {tone} 톤으로 {length}자 내외 HTML 형식으로 출력해줘.',
  },
];

const toneOptions = ['친근한', '전문적인', '유머러스한', '정보전달형', '감성적인'];

/**
 * HTML 본문의 소제목(h2/h3) 사이에 이미지를 균등 삽입
 */
function insertImagesIntoContent(
  html: string,
  images: { url: string; source: string; pageUrl: string }[],
): string {
  // 소제목 태그 위치 찾기
  const headingRegex = /<h[23][^>]*>/gi;
  const headingPositions: number[] = [];
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    headingPositions.push(match.index);
  }

  if (headingPositions.length < 2 || images.length === 0) {
    // 소제목이 부족하면 글 끝에 이미지 추가
    const imgTags = images
      .map((img) => `<figure style="text-align:center;margin:20px 0"><img src="${img.url}" alt="" style="max-width:100%;border-radius:8px" /><figcaption style="font-size:12px;color:#888;margin-top:4px">출처: ${img.source}</figcaption></figure>`)
      .join('\n');
    return html + '\n' + imgTags;
  }

  // 소제목 사이에 균등 배분 (첫 소제목 제외)
  const insertPositions = headingPositions.slice(1);
  const step = Math.max(1, Math.floor(insertPositions.length / images.length));

  const inserts: { position: number; imgTag: string }[] = [];
  for (let i = 0; i < images.length && i * step < insertPositions.length; i++) {
    const img = images[i];
    const pos = insertPositions[i * step];
    const imgTag = `<figure style="text-align:center;margin:20px 0"><img src="${img.url}" alt="" style="max-width:100%;border-radius:8px" /><figcaption style="font-size:12px;color:#888;margin-top:4px">출처: ${img.source}</figcaption></figure>\n`;
    inserts.push({ position: pos, imgTag });
  }

  // 뒤에서부터 삽입 (위치 밀림 방지)
  let result = html;
  for (let i = inserts.length - 1; i >= 0; i--) {
    const { position, imgTag } = inserts[i];
    result = result.slice(0, position) + imgTag + result.slice(position);
  }

  return result;
}

export default function NewPostPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>(fallbackPrompts);
  const [keyword, setKeyword] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState(fallbackPrompts[0].id);
  const [tone, setTone] = useState('친근한');
  const [length, setLength] = useState(1500);
  const [provider, setProvider] = useState('claude');
  const [insertImages, setInsertImages] = useState(false);
  const [imageSource, setImageSource] = useState('');
  const [availableImageSources, setAvailableImageSources] = useState<{ key: string; label: string }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [previewTab, setPreviewTab] = useState<'preview' | 'html' | 'markdown'>('preview');
  const [markdownContent, setMarkdownContent] = useState('');
  const [title, setTitle] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedPostId, setSavedPostId] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const fetchPlatforms = useCallback(async () => {
    try {
      const res = await fetch('/api/platforms');
      const data = await res.json();
      // 크레덴셜이 설정된 플랫폼만 표시
      const filtered = await Promise.all(
        data.map(async (p: Platform) => {
          if (p.type === 'BLOGSPOT') return p.credentials?.accessToken ? p : null;
          if (p.type === 'WORDPRESS') return p.credentials?.password ? p : null;
          if (p.type === 'NAVER') {
            // 세션 존재 여부 빠른 체크
            try {
              const sessionRes = await fetch(`/api/auth/session-check?platform=naver&quick=true`);
              const session = await sessionRes.json();
              return session.valid ? p : null;
            } catch { return null; }
          }
          if (p.type === 'TISTORY') {
            try {
              const sessionRes = await fetch(`/api/auth/session-check?platform=tistory&quick=true`);
              const session = await sessionRes.json();
              return session.valid ? p : null;
            } catch { return null; }
          }
          return null;
        })
      );
      setPlatforms(filtered.filter(Boolean) as Platform[]);
    } catch {
      // 무시
    }
  }, []);

  // DB에서 설정 로드
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.ai_prompts) {
          try {
            const dbPrompts = JSON.parse(data.ai_prompts);
            if (dbPrompts.length > 0) {
              setPrompts(dbPrompts);
              setSelectedPromptId(dbPrompts[0].id);
            }
          } catch { /* ignore */ }
        }
        if (data.ai_default_provider) {
          setProvider(data.ai_default_provider);
        }
        // API Key가 저장된 이미지 소스 감지
        const sources: { key: string; label: string }[] = [];
        if (data.image_pixabay_api_key) sources.push({ key: 'pixabay', label: 'Pixabay (검색)' });
        if (data.image_unsplash_api_key) sources.push({ key: 'unsplash', label: 'Unsplash (검색)' });
        if (data.ai_api_key_openai) sources.push({ key: 'dalle', label: 'DALL-E (AI 생성)' });
        if (data.ai_api_key_gemini) sources.push({ key: 'gemini_imagen', label: 'Gemini Imagen (AI 생성)' });
        setAvailableImageSources(sources);
        if (sources.length > 0) {
          setImageSource(sources[0].key);
        }
        if (data.writing_char_length) {
          setLength(parseInt(data.writing_char_length));
        }
      })
      .catch(() => { /* ignore */ });
  }, []);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      toast.error('키워드를 입력하세요');
      return;
    }

    const prompt = prompts.find((p) => p.id === selectedPromptId);
    if (!prompt) return;

    setGenerating(true);
    setGeneratedContent('');
    setTitle('');

    try {
      const res = await fetch('/api/posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          prompt: prompt.content,
          systemPrompt: prompt.systemPrompt || undefined,
          tone,
          length,
          provider,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // 마크다운 코드블록 래핑 제거 (OpenAI가 ```html ... ``` 로 감싸는 경우)
        let finalContent = data.content
          .replace(/^```html\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();

        // 이미지 자동 삽입
        if (insertImages) {
          try {
            const imgRes = await fetch('/api/images/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ keyword, source: imageSource }),
            });
            const imgData = await imgRes.json();
            if (imgData.success && imgData.images?.length > 0) {
              finalContent = insertImagesIntoContent(finalContent, imgData.images);
              toast.success(`이미지 ${imgData.images.length}장이 삽입되었습니다`);
            } else if (imgData.success && imgData.images?.length === 0) {
              toast.warning('해당 키워드로 이미지를 찾지 못했습니다. 다른 키워드나 소스를 시도해보세요.');
            } else if (imgData.error) {
              toast.error(`이미지 검색 실패: ${imgData.error}`);
            }
          } catch {
            // 이미지 삽입 실패해도 글 생성은 계속
          }
        }

        setGeneratedContent(finalContent);
        // HTML → 마크다운 변환
        const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
        setMarkdownContent(turndown.turndown(finalContent));
        setPreviewTab('preview');
        // 제목 자동 추출 (첫 번째 h1 또는 h2 태그에서)
        const titleMatch = finalContent.match(/<h[12][^>]*>(.*?)<\/h[12]>/i);
        const autoTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : keyword;
        setTitle(autoTitle);

        // 자동 DRAFT 저장
        try {
          const saveRes = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: autoTitle, content: finalContent, keyword }),
          });
          const saved = await saveRes.json();
          if (saved.id) {
            setSavedPostId(saved.id);
            toast.success('글이 생성되어 초안으로 저장되었습니다');
          }
        } catch {
          toast.success('글이 생성되었습니다');
        }
      } else {
        toast.error(data.error || '글 생성에 실패했습니다');
      }
    } catch {
      toast.error('글 생성에 실패했습니다');
    } finally {
      setGenerating(false);
    }
  };

  const handlePlatformToggle = (id: string) => {
    setSelectedPlatformIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handlePublish = async () => {
    if (!generatedContent) {
      toast.error('먼저 글을 생성하세요');
      return;
    }
    if (selectedPlatformIds.length === 0) {
      toast.error('발행할 플랫폼을 선택하세요');
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || keyword,
          content: generatedContent,
          keyword,
          platformIds: selectedPlatformIds,
          postId: savedPostId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const results = data.results as { platform: string; success: boolean; url?: string; error?: string }[];
        const anySuccess = results.some((r) => r.success);
        if (anySuccess) setPublished(true);
        results.forEach((r) => {
          if (r.success) {
            toast.success(`${r.platform}: 발행 성공!`, {
              description: r.url,
            });
          } else {
            toast.error(`${r.platform}: 발행 실패`, {
              description: r.error,
            });
          }
        });
      } else {
        toast.error(data.error || '발행에 실패했습니다');
      }
    } catch {
      toast.error('발행에 실패했습니다');
    } finally {
      setPublishing(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success('클립보드에 복사되었습니다');
    setTimeout(() => setCopied(false), 2000);
  };

  const platformColors: Record<string, string> = {
    BLOGSPOT: '#FF6F00',
    WORDPRESS: '#21759B',
    NAVER: '#03C75A',
    TISTORY: '#FF5A4A',
  };

  const platformLabels: Record<string, string> = {
    BLOGSPOT: '블로그스팟',
    WORDPRESS: '워드프레스',
    NAVER: '네이버',
    TISTORY: '티스토리',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">새 글 쓰기</h1>
        <p className="text-sm text-muted-foreground">
          AI로 블로그 글을 생성하고 플랫폼에 발행합니다
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* 왼쪽: 글 생성 설정 */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold">글 생성</h2>

            {/* 키워드 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">키워드</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 재테크 방법, 맛집 추천"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* 프롬프트 선택 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">프롬프트</label>
              <div className="relative">
                <select
                  value={selectedPromptId}
                  onChange={(e) => setSelectedPromptId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {prompts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* AI 제공자 선택 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">AI 모델</label>
              <div className="relative">
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {AI_PROVIDERS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* 톤 + 글자수 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">톤</label>
                <div className="relative">
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {toneOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">글자수</label>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* 이미지 소스 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">이미지 삽입</label>
              <div className="relative">
                <select
                  value={insertImages ? imageSource : 'none'}
                  onChange={(e) => {
                    if (e.target.value === 'none') {
                      setInsertImages(false);
                    } else {
                      setInsertImages(true);
                      setImageSource(e.target.value);
                    }
                  }}
                  className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="none">사용 안 함</option>
                  {availableImageSources.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* 생성 버튼 */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {AI_PROVIDERS.find((p) => p.key === provider)?.icon} 글 생성
                </>
              )}
            </button>
          </div>

          {/* 발행 플랫폼 선택 */}
          {generatedContent && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
              <h2 className="text-lg font-semibold">발행</h2>

              {/* 제목 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="글 제목"
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* 플랫폼 선택 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">발행 플랫폼</label>
                {platforms.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    연동된 플랫폼이 없습니다. 사이트 설정에서 플랫폼을 연동해주세요.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((p) => {
                      const selected = selectedPlatformIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => handlePlatformToggle(p.id)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            selected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: platformColors[p.type] }}
                          />
                          {p.name}
                          <span className="text-xs">({platformLabels[p.type]})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 발행 버튼 */}
              <button
                onClick={handlePublish}
                disabled={publishing || selectedPlatformIds.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-primary bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    발행 중...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    선택한 플랫폼에 발행
                  </>
                )}
              </button>

              {/* 저장 상태 표시 */}
              {savedPostId && !published && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Save className="h-3.5 w-3.5" />
                  <span>초안 저장됨</span>
                  <button
                    onClick={() => router.push(`/posts/${savedPostId}`)}
                    className="text-primary hover:underline"
                  >
                    상세 보기
                  </button>
                </div>
              )}

              {published && (
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/posts')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <List className="h-4 w-4" />
                    글 목록 보기
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedContent('');
                      setTitle('');
                      setKeyword('');
                      setSavedPostId(null);
                      setPublished(false);
                      setSelectedPlatformIds([]);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <PenLine className="h-4 w-4" />
                    새 글 작성
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 오른쪽: 미리보기 / HTML 편집 / 마크다운 편집 */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            {generatedContent ? (
              <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                <button
                  onClick={() => setPreviewTab('preview')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    previewTab === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  미리보기
                </button>
                <button
                  onClick={() => setPreviewTab('html')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    previewTab === 'html' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  HTML
                </button>
                <button
                  onClick={() => setPreviewTab('markdown')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    previewTab === 'markdown' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  마크다운
                </button>
              </div>
            ) : (
              <h2 className="text-lg font-semibold">미리보기</h2>
            )}
            {generatedContent && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-input px-2.5 py-1.5 text-xs hover:bg-muted transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '복사됨' : '복사'}
              </button>
            )}
          </div>

          {generating ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">AI가 글을 작성하고 있습니다...</p>
            </div>
          ) : generatedContent ? (
            <>
              {previewTab === 'preview' && (
                <div
                  className="prose prose-sm dark:prose-invert mt-4 max-w-none"
                  dangerouslySetInnerHTML={{ __html: generatedContent }}
                />
              )}
              {previewTab === 'html' && (
                <textarea
                  value={generatedContent}
                  onChange={(e) => {
                    setGeneratedContent(e.target.value);
                    const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
                    setMarkdownContent(turndown.turndown(e.target.value));
                  }}
                  className="mt-4 w-full min-h-[500px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                  placeholder="HTML 소스를 직접 수정할 수 있습니다..."
                />
              )}
              {previewTab === 'markdown' && (
                <textarea
                  value={markdownContent}
                  onChange={(e) => {
                    setMarkdownContent(e.target.value);
                    const html = marked.parse(e.target.value);
                    if (typeof html === 'string') {
                      setGeneratedContent(html);
                    }
                  }}
                  className="mt-4 w-full min-h-[500px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                  placeholder="마크다운으로 수정할 수 있습니다..."
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                키워드를 입력하고 AI 글 생성 버튼을 클릭하세요
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                생성된 글이 여기에 미리보기로 표시됩니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
