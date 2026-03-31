'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Plus, Trash2, PenLine, Loader2, Search, X, RefreshCw, TrendingUp, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

interface Keyword {
  id: string;
  keyword: string;
  searchVolume: number | null;
  pcSearchVolume: number | null;
  mobileSearchVolume: number | null;
  competition: string | null;
  createdAt: string;
}

export default function KeywordAnalysisPage() {
  const router = useRouter();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [adding, setAdding] = useState(false);
  const [fetchingVolume, setFetchingVolume] = useState(false);

  // 키워드 검색
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [googleResults, setGoogleResults] = useState<string[]>([]);
  const [naverResults, setNaverResults] = useState<string[]>([]);
  const [searchedKeyword, setSearchedKeyword] = useState('');
  const [searchTab, setSearchTab] = useState<'suggest' | 'volume'>('suggest');

  // 연관키워드 검색량 분석
  const [relatedKeywords, setRelatedKeywords] = useState<{ keyword: string; pcSearchVolume: number; mobileSearchVolume: number; totalSearchVolume: number; competition: string }[]>([]);
  const [fetchingRelated, setFetchingRelated] = useState(false);
  const [sortField, setSortField] = useState<'total' | 'pc' | 'mobile'>('total');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchKeywords = useCallback(async () => {
    try {
      const res = await fetch('/api/keywords');
      const data = await res.json();
      setKeywords(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  // 키워드 추가
  const handleAdd = async (kw?: string, volumeData?: { searchVolume: number; pcSearchVolume: number; mobileSearchVolume: number; competition: string }) => {
    const target = kw || newKeyword.trim();
    if (!target) {
      toast.error('키워드를 입력하세요');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: target, ...volumeData }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`"${data.keyword}" 키워드가 추가되었습니다`);
        setNewKeyword('');
        setShowAddForm(false);
        fetchKeywords();
      } else {
        toast.error(data.error || '추가에 실패했습니다');
      }
    } catch {
      toast.error('추가에 실패했습니다');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, keyword: string) => {
    if (!confirm(`"${keyword}" 키워드를 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/keywords?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('삭제되었습니다');
        fetchKeywords();
      }
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  // 검색량 일괄 조회
  const handleFetchVolume = async () => {
    if (keywords.length === 0) {
      toast.error('등록된 키워드가 없습니다');
      return;
    }

    setFetchingVolume(true);
    try {
      const res = await fetch('/api/keywords/search-volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keywords.map((k) => k.keyword) }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`${data.volumes.length}개 키워드 검색량이 업데이트되었습니다`);
        fetchKeywords();
      } else {
        toast.error(data.error || '검색량 조회에 실패했습니다');
      }
    } catch {
      toast.error('검색량 조회에 실패했습니다');
    } finally {
      setFetchingVolume(false);
    }
  };

  const handleWritePost = (kw: string) => {
    router.push(`/posts/new?keyword=${encodeURIComponent(kw)}`);
  };

  // 자동완성 검색
  const handleSearch = async (kw?: string) => {
    const target = kw || searchKeyword.trim();
    if (!target) {
      toast.error('검색할 키워드를 입력하세요');
      return;
    }

    setSearching(true);
    setSearchKeyword(target);
    try {
      const res = await fetch('/api/keywords/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: target }),
      });
      const data = await res.json();

      if (data.success) {
        setGoogleResults(data.google || []);
        setNaverResults(data.naver || []);
        setSearchedKeyword(target);
      }
    } catch {
      toast.error('검색에 실패했습니다');
    } finally {
      setSearching(false);
    }
  };

  // 연관키워드 검색량 분석
  const handleFetchRelated = async (kw?: string) => {
    const target = kw || searchKeyword.trim();
    if (!target) {
      toast.error('검색할 키워드를 입력하세요');
      return;
    }

    setFetchingRelated(true);
    setSearchKeyword(target);
    setSearchTab('volume');
    try {
      const res = await fetch('/api/keywords/related', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: target }),
      });
      const data = await res.json();

      if (data.success) {
        setRelatedKeywords(data.related || []);
        setSearchedKeyword(target);
      } else {
        toast.error(data.error || '조회에 실패했습니다');
      }
    } catch {
      toast.error('조회에 실패했습니다');
    } finally {
      setFetchingRelated(false);
    }
  };

  const handleSort = (field: 'total' | 'pc' | 'mobile') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedRelated = [...relatedKeywords].sort((a, b) => {
    const valA = sortField === 'pc' ? a.pcSearchVolume : sortField === 'mobile' ? a.mobileSearchVolume : a.totalSearchVolume;
    const valB = sortField === 'pc' ? b.pcSearchVolume : sortField === 'mobile' ? b.mobileSearchVolume : b.totalSearchVolume;
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') {
      setShowAddForm(false);
      setNewKeyword('');
    }
  };

  const getRecommendBadge = (kw: Keyword) => {
    if (!kw.searchVolume || !kw.competition) return null;

    let score = 0;
    if (kw.searchVolume >= 10000) score += 2;
    else if (kw.searchVolume >= 3000) score += 1;

    if (kw.competition === '낮음') score += 2;
    else if (kw.competition === '중간') score += 1;

    if (score >= 4) return { label: '강력 추천', color: 'bg-green-500/10 text-green-500' };
    if (score >= 3) return { label: '추천', color: 'bg-blue-500/10 text-blue-500' };
    if (score >= 2) return { label: '보통', color: 'bg-yellow-500/10 text-yellow-500' };
    return { label: '낮음', color: 'bg-gray-500/10 text-gray-400' };
  };

  const hasSearchResults = googleResults.length > 0 || naverResults.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">키워드분석</h1>
          <p className="text-sm text-muted-foreground">
            키워드를 검색하고 분석 목록에 추가하여 관리합니다
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          키워드 추가
        </button>
      </div>

      {/* 키워드 추가 폼 */}
      {showAddForm && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="추가할 키워드를 입력하세요"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <button
              onClick={() => handleAdd()}
              disabled={adding}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              추가
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewKeyword(''); }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 내 키워드 테이블 (위로 이동) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">내 키워드</h2>
          {keywords.length > 0 && (
            <button
              onClick={handleFetchVolume}
              disabled={fetchingVolume}
              className="flex items-center gap-2 rounded-lg border border-input px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              {fetchingVolume ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
              검색량 조회
            </button>
          )}
        </div>
        {keywords.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">키워드</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">PC</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">모바일</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">합계</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">경쟁도</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">추천도</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">등록일</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">액션</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw) => {
                  const badge = getRecommendBadge(kw);
                  return (
                    <tr key={kw.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{kw.keyword}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {kw.pcSearchVolume != null ? kw.pcSearchVolume.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {kw.mobileSearchVolume != null ? kw.mobileSearchVolume.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {kw.searchVolume != null ? kw.searchVolume.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {kw.competition ? (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            kw.competition === '낮음' ? 'bg-green-500/10 text-green-500' :
                            kw.competition === '중간' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>{kw.competition}</span>
                        ) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {badge ? (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>{badge.label}</span>
                        ) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {new Date(kw.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleSearch(kw.keyword)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                            <Search className="h-3 w-3" />검색
                          </button>
                          <button onClick={() => handleWritePost(kw.keyword)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                            <PenLine className="h-3 w-3" />글쓰기
                          </button>
                          <button onClick={() => handleDelete(kw.id, kw.keyword)} className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border bg-muted/30">
              총 {keywords.length}개 키워드
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">등록된 키워드가 없습니다</p>
            <p className="mt-1 text-xs text-muted-foreground">아래에서 키워드를 검색하고 [추가] 버튼으로 등록해보세요</p>
          </div>
        )}
      </div>

      {/* 연관 키워드 검색 (아래로 이동) */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold">연관 키워드 검색</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="키워드를 입력하면 Google/네이버 연관 키워드를 확인합니다"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={searching}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            검색
          </button>
        </div>

        {/* 탭 전환 */}
        {searchedKeyword && (
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 w-fit">
            <button
              onClick={() => setSearchTab('suggest')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                searchTab === 'suggest' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              자동완성
            </button>
            <button
              onClick={() => { setSearchTab('volume'); if (relatedKeywords.length === 0) handleFetchRelated(); }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                searchTab === 'volume' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              검색량 분석
            </button>
          </div>
        )}

        {/* 로딩 */}
        {(searching || fetchingRelated) && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* 자동완성 탭 */}
        {!searching && searchTab === 'suggest' && hasSearchResults && (
          <>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">&quot;{searchedKeyword}&quot;</span> 연관 키워드
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-border">
                <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[#4285F4] text-[10px] font-bold text-white">G</div>
                  <span className="text-xs font-semibold">Google</span>
                  <span className="ml-auto text-xs text-muted-foreground">{googleResults.length}개</span>
                </div>
                <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                  {googleResults.map((kw, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors">
                      <button onClick={() => handleSearch(kw)} className="flex items-center gap-2 text-sm text-left hover:text-primary transition-colors">
                        <RefreshCw className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{kw}</span>
                      </button>
                      <div className="flex shrink-0 gap-1">
                        <button onClick={() => handleAdd(kw)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                          <Plus className="h-3 w-3" />추가
                        </button>
                        <button onClick={() => handleWritePost(kw)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                          <PenLine className="h-3 w-3" />글쓰기
                        </button>
                      </div>
                    </div>
                  ))}
                  {googleResults.length === 0 && <p className="px-4 py-4 text-center text-xs text-muted-foreground">결과 없음</p>}
                </div>
              </div>
              <div className="rounded-lg border border-border">
                <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[#03C75A] text-[10px] font-bold text-white">N</div>
                  <span className="text-xs font-semibold">네이버</span>
                  <span className="ml-auto text-xs text-muted-foreground">{naverResults.length}개</span>
                </div>
                <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                  {naverResults.map((kw, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors">
                      <button onClick={() => handleSearch(kw)} className="flex items-center gap-2 text-sm text-left hover:text-primary transition-colors">
                        <RefreshCw className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{kw}</span>
                      </button>
                      <div className="flex shrink-0 gap-1">
                        <button onClick={() => handleAdd(kw)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                          <Plus className="h-3 w-3" />추가
                        </button>
                        <button onClick={() => handleWritePost(kw)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                          <PenLine className="h-3 w-3" />글쓰기
                        </button>
                      </div>
                    </div>
                  ))}
                  {naverResults.length === 0 && <p className="px-4 py-4 text-center text-xs text-muted-foreground">결과 없음</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 검색량 분석 탭 */}
        {!fetchingRelated && searchTab === 'volume' && relatedKeywords.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">&quot;{searchedKeyword}&quot;</span> 연관키워드 검색량 ({relatedKeywords.length}개)
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">연관키워드</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('pc')}>
                      <span className="inline-flex items-center gap-1">PC {sortField === 'pc' && <ArrowUpDown className="h-3 w-3" />}</span>
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('mobile')}>
                      <span className="inline-flex items-center gap-1">모바일 {sortField === 'mobile' && <ArrowUpDown className="h-3 w-3" />}</span>
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('total')}>
                      <span className="inline-flex items-center gap-1">합계 {sortField === 'total' && <ArrowUpDown className="h-3 w-3" />}</span>
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">경쟁도</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRelated.map((item, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{item.keyword}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{item.pcSearchVolume.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{item.mobileSearchVolume.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{item.totalSearchVolume.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.competition === '낮음' ? 'bg-green-500/10 text-green-500' :
                          item.competition === '중간' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>{item.competition}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleAdd(item.keyword, { searchVolume: item.totalSearchVolume, pcSearchVolume: item.pcSearchVolume, mobileSearchVolume: item.mobileSearchVolume, competition: item.competition })} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                            <Plus className="h-3 w-3" />추가
                          </button>
                          <button onClick={() => handleWritePost(item.keyword)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                            <PenLine className="h-3 w-3" />글쓰기
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!fetchingRelated && searchTab === 'volume' && relatedKeywords.length === 0 && searchedKeyword && (
          <p className="py-4 text-center text-sm text-muted-foreground">연관키워드를 찾지 못했습니다</p>
        )}

        {!searching && !fetchingRelated && !searchedKeyword && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            키워드를 입력하면 Google/네이버 연관 키워드와 검색량을 확인할 수 있습니다
          </p>
        )}
      </div>

    </div>
  );
}
