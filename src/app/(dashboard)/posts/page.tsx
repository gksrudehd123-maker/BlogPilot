'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Search, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

type PublishLog = {
  id: string;
  status: string;
  publishedUrl: string | null;
  publishedAt: string | null;
  platform: { name: string; type: string };
};

type Post = {
  id: string;
  title: string;
  keyword: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishLogs: PublishLog[];
  _count: { publishLogs: number };
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '초안', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  PUBLISHING: { label: '발행 중', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  PUBLISHED: { label: '발행 완료', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  FAILED: { label: '발행 실패', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  SCHEDULED: { label: '예약됨', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
};

const PLATFORM_COLORS: Record<string, string> = {
  BLOGSPOT: '#FF6F00',
  WORDPRESS: '#21759B',
  NAVER: '#03C75A',
  TISTORY: '#FF5A4A',
};

export default function PostListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, refetch } = useQuery<{
    data: Post[];
    meta: { total: number; page: number; totalPages: number };
  }>({
    queryKey: ['posts', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/posts?${params}`);
      return res.json();
    },
  });

  const posts = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('이 글을 삭제하시겠습니까?')) return;

    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('글이 삭제되었습니다');
      refetch();
    } else {
      toast.error('삭제에 실패했습니다');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">글 목록</h1>
          <p className="text-sm text-muted-foreground">
            저장된 글을 관리하고 발행합니다
          </p>
        </div>
        <button
          onClick={() => router.push('/posts/new')}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          새 글 쓰기
        </button>
      </div>

      {/* 필터 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="제목, 키워드 검색..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">전체 상태</option>
          <option value="DRAFT">초안</option>
          <option value="PUBLISHED">발행 완료</option>
          <option value="FAILED">발행 실패</option>
        </select>
        {meta && (
          <span className="shrink-0 text-sm text-muted-foreground">
            총 {meta.total}건
          </span>
        )}
      </div>

      {/* 글 목록 */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              {search || statusFilter ? '검색 결과가 없습니다' : '아직 작성된 글이 없습니다'}
            </p>
            {!search && !statusFilter && (
              <button
                onClick={() => router.push('/posts/new')}
                className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                첫 글 작성하기
              </button>
            )}
          </div>
        ) : (
          posts.map((post) => {
            const badge = STATUS_BADGE[post.status] || STATUS_BADGE.DRAFT;
            const successLogs = post.publishLogs.filter((l) => l.status === 'SUCCESS');

            return (
              <div
                key={post.id}
                onClick={() => router.push(`/posts/${post.id}`)}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm cursor-pointer hover:border-primary/30 hover:shadow-md transition-all sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{post.title}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {post.keyword && (
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {post.keyword}
                      </span>
                    )}
                    <span>{formatDate(post.updatedAt)}</span>
                    {successLogs.length > 0 && (
                      <div className="flex items-center gap-1">
                        {successLogs.map((log) => (
                          <div
                            key={log.id}
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: PLATFORM_COLORS[log.platform.type] || '#888' }}
                            title={`${log.platform.name} 발행됨`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(post.id, e)}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 페이지네이션 */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
          >
            이전
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="rounded-lg px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
