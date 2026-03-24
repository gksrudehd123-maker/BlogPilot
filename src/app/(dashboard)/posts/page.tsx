'use client';

import { FileText, Plus } from 'lucide-react';

export default function PostsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">글 관리</h1>
          <p className="text-sm text-muted-foreground">
            AI로 생성한 글을 관리하고 발행합니다
          </p>
        </div>
        <button className="flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          새 글 작성
        </button>
      </div>

      {/* 빈 상태 테이블 */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">제목</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">키워드</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">상태</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">발행 플랫폼</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium">작성일</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  작성된 글이 없습니다. 새 글을 작성해보세요.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
