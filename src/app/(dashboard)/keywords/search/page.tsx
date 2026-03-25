'use client';

import { Search } from 'lucide-react';

export default function KeywordSearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">키워드검색</h1>
        <p className="text-sm text-muted-foreground">
          키워드를 검색하고 트렌드를 확인합니다
        </p>
      </div>

      {/* 검색 바 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="키워드를 입력하세요..."
          className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <Search className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          검색어를 입력하면 관련 키워드와 검색량을 분석합니다
        </p>
      </div>
    </div>
  );
}
