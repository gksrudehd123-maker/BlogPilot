'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Sparkles, Send, ChevronDown, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Platform {
  id: string;
  type: string;
  name: string;
  credentials: Record<string, string> | null;
}

const defaultPrompts = [
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

export default function PostsPage() {
  const [keyword, setKeyword] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState(defaultPrompts[0].id);
  const [tone, setTone] = useState('친근한');
  const [length, setLength] = useState(1500);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [title, setTitle] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchPlatforms = useCallback(async () => {
    try {
      const res = await fetch('/api/platforms');
      const data = await res.json();
      setPlatforms(data.filter((p: Platform) => {
        if (p.type === 'BLOGSPOT') return !!p.credentials?.accessToken;
        if (p.type === 'WORDPRESS') return !!p.credentials?.password;
        return false;
      }));
    } catch {
      // 무시
    }
  }, []);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      toast.error('키워드를 입력하세요');
      return;
    }

    const prompt = defaultPrompts.find((p) => p.id === selectedPromptId);
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
          tone,
          length,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setGeneratedContent(data.content);
        // 제목 자동 추출 (첫 번째 h1 또는 h2 태그에서)
        const titleMatch = data.content.match(/<h[12][^>]*>(.*?)<\/h[12]>/i);
        if (titleMatch) {
          setTitle(titleMatch[1].replace(/<[^>]*>/g, ''));
        } else {
          setTitle(keyword);
        }
        toast.success('글이 생성되었습니다');
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
        }),
      });

      const data = await res.json();

      if (data.success) {
        const results = data.results as { platform: string; success: boolean; url?: string; error?: string }[];
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
        <h1 className="text-2xl font-semibold">글쓰기</h1>
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
                  {defaultPrompts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
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
                  AI 글 생성
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
            </div>
          )}
        </div>

        {/* 오른쪽: 미리보기 */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">미리보기</h2>
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
            <div
              className="prose prose-sm dark:prose-invert mt-4 max-w-none"
              dangerouslySetInnerHTML={{ __html: generatedContent }}
            />
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
