'use client';

import { BarChart3, Plus } from 'lucide-react';

export default function KeywordAnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">키워드분석</h1>
          <p className="text-sm text-muted-foreground">
            키워드 검색량과 경쟁도를 분석합니다
          </p>
        </div>
        <button className="flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          키워드 추가
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          등록된 키워드가 없습니다
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          키워드를 추가하고 검색량을 분석해보세요
        </p>
      </div>
    </div>
  );
}
