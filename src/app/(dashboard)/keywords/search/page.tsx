'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, PenLine, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function KeywordSearchPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [googleResults, setGoogleResults] = useState<string[]>([]);
  const [naverResults, setNaverResults] = useState<string[]>([]);
  const [searchedKeyword, setSearchedKeyword] = useState('');

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error('키워드를 입력하세요');
      return;
    }

    setSearching(true);
    try {
      const res = await fetch('/api/keywords/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setGoogleResults(data.google || []);
        setNaverResults(data.naver || []);
        setSearchedKeyword(keyword.trim());
      } else {
        toast.error(data.error || '검색에 실패했습니다');
      }
    } catch {
      toast.error('검색에 실패했습니다');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // 연관 키워드를 클릭하면 해당 키워드로 재검색
  const handleKeywordClick = (kw: string) => {
    setKeyword(kw);
    setSearching(true);
    fetch('/api/keywords/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: kw }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setGoogleResults(data.google || []);
          setNaverResults(data.naver || []);
          setSearchedKeyword(kw);
        }
      })
      .finally(() => setSearching(false));
  };

  // 해당 키워드로 바로 글쓰기 이동
  const handleWritePost = (kw: string) => {
    router.push(`/posts/new?keyword=${encodeURIComponent(kw)}`);
  };

  const hasResults = googleResults.length > 0 || naverResults.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">키워드검색</h1>
        <p className="text-sm text-muted-foreground">
          키워드를 검색하면 Google과 네이버의 연관 키워드를 확인할 수 있습니다
        </p>
      </div>

      {/* 검색 바 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="키워드를 입력하세요..."
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          검색
        </button>
      </div>

      {/* 검색 결과 */}
      {searching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!searching && hasResults && (
        <>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">&quot;{searchedKeyword}&quot;</span> 연관 키워드
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Google 자동완성 */}
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[#4285F4] text-xs font-bold text-white">G</div>
                <h3 className="text-sm font-semibold">Google</h3>
                <span className="ml-auto text-xs text-muted-foreground">{googleResults.length}개</span>
              </div>
              <div className="divide-y divide-border">
                {googleResults.map((kw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <button
                      onClick={() => handleKeywordClick(kw)}
                      className="flex items-center gap-2 text-sm text-left hover:text-primary transition-colors"
                    >
                      <RefreshCw className="h-3 w-3 text-muted-foreground" />
                      {kw}
                    </button>
                    <button
                      onClick={() => handleWritePost(kw)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <PenLine className="h-3 w-3" />
                      글쓰기
                    </button>
                  </div>
                ))}
                {googleResults.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">결과 없음</p>
                )}
              </div>
            </div>

            {/* 네이버 자동완성 */}
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[#03C75A] text-xs font-bold text-white">N</div>
                <h3 className="text-sm font-semibold">네이버</h3>
                <span className="ml-auto text-xs text-muted-foreground">{naverResults.length}개</span>
              </div>
              <div className="divide-y divide-border">
                {naverResults.map((kw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <button
                      onClick={() => handleKeywordClick(kw)}
                      className="flex items-center gap-2 text-sm text-left hover:text-primary transition-colors"
                    >
                      <RefreshCw className="h-3 w-3 text-muted-foreground" />
                      {kw}
                    </button>
                    <button
                      onClick={() => handleWritePost(kw)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <PenLine className="h-3 w-3" />
                      글쓰기
                    </button>
                  </div>
                ))}
                {naverResults.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">결과 없음</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {!searching && !hasResults && !searchedKeyword && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            키워드를 입력하면 Google과 네이버의 연관 키워드를 확인할 수 있습니다
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            연관 키워드를 클릭하면 재검색, 글쓰기 버튼으로 바로 글 생성이 가능합니다
          </p>
        </div>
      )}

      {!searching && !hasResults && searchedKeyword && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            &quot;{searchedKeyword}&quot;에 대한 연관 키워드를 찾지 못했습니다
          </p>
        </div>
      )}
    </div>
  );
}
