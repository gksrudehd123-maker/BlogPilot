'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send, Loader2, Copy, Check, ExternalLink, Eye, PenLine } from 'lucide-react';
import { toast } from 'sonner';

type PublishLog = {
  id: string;
  status: string;
  publishedUrl: string | null;
  errorMessage: string | null;
  publishedAt: string | null;
  createdAt: string;
  platform: { name: string; type: string };
};

type Post = {
  id: string;
  title: string;
  content: string;
  keyword: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishLogs: PublishLog[];
};

interface Platform {
  id: string;
  type: string;
  name: string;
  credentials: Record<string, string> | null;
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '초안', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  PUBLISHING: { label: '발행 중', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  PUBLISHED: { label: '발행 완료', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  FAILED: { label: '발행 실패', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

const PLATFORM_COLORS: Record<string, string> = {
  BLOGSPOT: '#FF6F00',
  WORDPRESS: '#21759B',
  NAVER: '#03C75A',
  TISTORY: '#FF5A4A',
};

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [keyword, setKeyword] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // 발행용 state
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
          router.push('/posts');
          return;
        }
        setPost(data);
        setTitle(data.title);
        setContent(data.content);
        setKeyword(data.keyword || '');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const fetchPlatforms = useCallback(async () => {
    try {
      const res = await fetch('/api/platforms');
      const data = await res.json();
      const filtered = await Promise.all(
        data.map(async (p: Platform) => {
          if (p.type === 'BLOGSPOT') return p.credentials?.accessToken ? p : null;
          if (p.type === 'WORDPRESS') return p.credentials?.password ? p : null;
          if (p.type === 'NAVER') {
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

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, keyword: keyword || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPost((prev) => prev ? { ...prev, ...updated } : prev);
        toast.success('저장되었습니다');
      } else {
        toast.error('저장에 실패했습니다');
      }
    } catch {
      toast.error('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
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
          title,
          content,
          keyword: post?.keyword,
          platformIds: selectedPlatformIds,
          postId: id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const results = data.results as { platform: string; success: boolean; url?: string; error?: string }[];
        results.forEach((r) => {
          if (r.success) {
            toast.success(`${r.platform}: 발행 성공!`, { description: r.url });
          } else {
            toast.error(`${r.platform}: 발행 실패`, { description: r.error });
          }
        });
        // 글 다시 로드 (상태 + 발행 이력 갱신)
        const refreshed = await fetch(`/api/posts/${id}`).then((r) => r.json());
        setPost(refreshed);
      }
    } catch {
      toast.error('발행에 실패했습니다');
    } finally {
      setPublishing(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('클립보드에 복사되었습니다');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) return null;

  const badge = STATUS_BADGE[post.status] || STATUS_BADGE.DRAFT;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/posts')}
          className="rounded-lg p-2 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">글 편집</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            생성: {formatDate(post.createdAt)} | 수정: {formatDate(post.updatedAt)}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          저장
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* 왼쪽: 편집 */}
        <div className="space-y-4">
          {/* 제목 */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">키워드</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="타겟 키워드"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* 발행 */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold">발행</h2>
            {platforms.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                연동된 플랫폼이 없습니다.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {platforms.map((p) => {
                  const selected = selectedPlatformIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        setSelectedPlatformIds((prev) =>
                          prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                        )
                      }
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PLATFORM_COLORS[p.type] }}
                      />
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={handlePublish}
              disabled={publishing || selectedPlatformIds.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-primary bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              {publishing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> 발행 중...</>
              ) : (
                <><Send className="h-4 w-4" /> 선택한 플랫폼에 발행</>
              )}
            </button>
          </div>

          {/* 발행 이력 */}
          {post.publishLogs.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-3">
              <h2 className="text-lg font-semibold">발행 이력</h2>
              <div className="space-y-2">
                {post.publishLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: PLATFORM_COLORS[log.platform.type] || '#888' }}
                    />
                    <span className="font-medium">{log.platform.name}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                      log.status === 'SUCCESS'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {log.status === 'SUCCESS' ? '성공' : '실패'}
                    </span>
                    <span className="flex-1 text-xs text-muted-foreground">
                      {log.publishedAt ? formatDate(log.publishedAt) : formatDate(log.createdAt)}
                    </span>
                    {log.publishedUrl && (
                      <a
                        href={log.publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {log.errorMessage && (
                      <span className="text-xs text-red-500 truncate max-w-[150px]" title={log.errorMessage}>
                        {log.errorMessage}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 미리보기 / 편집 */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
              <button
                onClick={() => setEditMode(false)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  !editMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                미리보기
              </button>
              <button
                onClick={() => setEditMode(true)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  editMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <PenLine className="h-3.5 w-3.5" />
                편집
              </button>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-input px-2.5 py-1.5 text-xs hover:bg-muted transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
          {editMode ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-4 w-full min-h-[500px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="HTML 콘텐츠를 편집합니다..."
            />
          ) : (
            <div
              className="prose prose-sm dark:prose-invert mt-4 max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
