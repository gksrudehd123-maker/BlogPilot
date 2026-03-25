'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Globe, Trash2, Plug, ChevronDown, Loader2, Monitor } from 'lucide-react';
import { toast } from 'sonner';

interface Platform {
  id: string;
  type: string;
  name: string;
  blogUrl: string | null;
  credentials: Record<string, string> | null;
  isActive: boolean;
}

const platformOptions = [
  { value: 'NAVER', label: '네이버 블로그', color: '#03C75A' },
  { value: 'WORDPRESS', label: '워드프레스', color: '#21759B' },
  { value: 'BLOGSPOT', label: '블로그스팟', color: '#FF6F00' },
  { value: 'TISTORY', label: '티스토리', color: '#FF5A4A' },
];

const platformFields: Record<string, { label: string; key: string; type?: string; placeholder: string }[]> = {
  NAVER: [
    { label: '카테고리', key: 'category', placeholder: '기본 카테고리 (선택)' },
  ],
  WORDPRESS: [
    { label: '사이트 URL', key: 'siteUrl', placeholder: 'https://your-site.com' },
    { label: '사용자명', key: 'username', placeholder: 'WordPress 사용자명' },
    { label: 'App Password', key: 'password', type: 'password', placeholder: 'Application Password' },
    { label: '카테고리', key: 'category', placeholder: '기본 카테고리' },
  ],
  BLOGSPOT: [
    { label: '블로그 ID', key: 'blogId', placeholder: 'Blogger 블로그 ID' },
    { label: '라벨', key: 'label', placeholder: '기본 라벨' },
  ],
  TISTORY: [
    { label: '블로그명', key: 'blogName', placeholder: '블로그 주소명 (예: handongmoa)' },
    { label: '카테고리', key: 'category', placeholder: '기본 카테고리 (선택)' },
  ],
};

const platformNotes: Record<string, string> = {
  BLOGSPOT: 'Google OAuth 2.0으로 인증합니다. 계정 저장 후 Google 계정 연동을 진행하세요.',
  TISTORY: 'Playwright 브라우저 자동화로 발행합니다. 아래 "브라우저 로그인" 버튼으로 카카오 로그인이 필요합니다.',
  NAVER: 'Playwright 브라우저 자동화로 발행합니다. 아래 "브라우저 로그인" 버튼으로 네이버 로그인이 필요합니다.',
};

export default function SiteSettingsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('NAVER');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [browserLogin, setBrowserLogin] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<Record<string, { valid: boolean; message: string }>>({});
  const searchParams = useSearchParams();

  // OAuth 콜백 결과 처리
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success === 'google_connected') {
      toast.success('Google 계정이 연동되었습니다');
      setSelectedPlatform('BLOGSPOT');
      window.history.replaceState({}, '', '/settings/sites');
    }
    if (error === 'oauth_denied') {
      toast.error('Google 인증이 취소되었습니다');
      window.history.replaceState({}, '', '/settings/sites');
    }
    if (error === 'token_failed') {
      toast.error('Google 토큰 발급에 실패했습니다');
      window.history.replaceState({}, '', '/settings/sites');
    }
  }, [searchParams]);

  const current = platformOptions.find((p) => p.value === selectedPlatform)!;
  const fields = platformFields[selectedPlatform] || [];
  const filteredPlatforms = platforms.filter((p) => p.type === selectedPlatform);

  const fetchPlatforms = useCallback(async () => {
    try {
      const res = await fetch('/api/platforms');
      const data = await res.json();
      setPlatforms(data);
    } catch {
      toast.error('계정 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  // 네이버/티스토리 세션 상태 체크
  const checkBrowserSession = useCallback(async (platform: 'naver' | 'tistory') => {
    try {
      const res = await fetch(`/api/auth/session-check?platform=${platform}&quick=true`);
      const data = await res.json();
      setSessionStatus((prev) => ({ ...prev, [platform]: data }));
    } catch {
      setSessionStatus((prev) => ({
        ...prev,
        [platform]: { valid: false, message: '세션 확인 실패' },
      }));
    }
  }, []);

  // 브라우저 로그인 실행
  const handleBrowserLogin = async (platform: 'naver' | 'tistory') => {
    setBrowserLogin(true);
    const blogName = platform === 'tistory' ? formData.blogName : undefined;

    if (platform === 'tistory' && !blogName) {
      toast.error('블로그명을 먼저 입력하세요');
      setBrowserLogin(false);
      return;
    }

    toast.info('브라우저가 열립니다. 로그인을 완료해주세요.');

    try {
      const res = await fetch('/api/auth/browser-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, blogName }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        await checkBrowserSession(platform);
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('브라우저 로그인에 실패했습니다');
    } finally {
      setBrowserLogin(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
    checkBrowserSession('naver');
    checkBrowserSession('tistory');
  }, [fetchPlatforms, checkBrowserSession]);

  // 계정 선택 시 폼에 데이터 로드
  useEffect(() => {
    if (selectedAccountId) {
      const account = platforms.find((p) => p.id === selectedAccountId);
      if (account) {
        setAccountName(account.name);
        setFormData((account.credentials as Record<string, string>) || {});
        return;
      }
    }
    setAccountName('');
    setFormData({});
  }, [selectedAccountId, platforms]);

  // 플랫폼 타입 변경 시 선택 초기화
  useEffect(() => {
    setSelectedAccountId('');
    setAccountName('');
    setFormData({});
  }, [selectedPlatform]);

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!accountName.trim()) {
      toast.error('계정명을 입력하세요');
      return;
    }

    setSaving(true);
    try {
      const blogUrl =
        formData.siteUrl || formData.domain
          ? formData.siteUrl || `https://blog.naver.com/${formData.domain}`
          : null;

      if (selectedAccountId) {
        // 수정
        const res = await fetch(`/api/platforms/${selectedAccountId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: accountName,
            blogUrl,
            credentials: formData,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success('계정이 수정되었습니다');
      } else {
        // 새로 생성
        const res = await fetch('/api/platforms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: selectedPlatform,
            name: accountName,
            blogUrl,
            credentials: formData,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success('계정이 등록되었습니다');
      }

      await fetchPlatforms();
      setSelectedAccountId('');
      setAccountName('');
      setFormData({});
    } catch {
      toast.error('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAccountId) {
      toast.error('삭제할 계정을 선택하세요');
      return;
    }

    if (!confirm('정말 이 계정을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/platforms/${selectedAccountId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success('계정이 삭제되었습니다');
      await fetchPlatforms();
      setSelectedAccountId('');
      setAccountName('');
      setFormData({});
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  const handleTest = async () => {
    if (!selectedAccountId) {
      toast.error('테스트할 계정을 선택하세요');
      return;
    }

    setTesting(true);
    try {
      const res = await fetch('/api/platforms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformId: selectedAccountId,
          type: selectedPlatform,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || '연결에 실패했습니다');
      }
    } catch {
      toast.error('연결테스트에 실패했습니다');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">사이트 설정</h1>
        <p className="text-sm text-muted-foreground">
          블로그 플랫폼 계정을 등록하고 관리합니다
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        {/* 사이트 타입 선택 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">
              사이트 타입
            </label>
            <div className="relative mt-1.5">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {platformOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={!selectedAccountId}
              className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-3.5 w-3.5" />
              계정 삭제
            </button>
          </div>
        </div>

        {/* 플랫폼 아이콘 + 이름 */}
        <div className="mt-6 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: current.color }}
          >
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium">{current.label}</p>
            <p className="text-xs text-muted-foreground">
              등록된 계정: {filteredPlatforms.length}개
            </p>
          </div>
        </div>

        {/* 계정 정보 폼 */}
        <div className="mt-6 space-y-4">
          {/* 계정 선택 */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <label className="w-32 shrink-0 text-sm text-muted-foreground">
              계정 선택
            </label>
            <div className="relative flex-1">
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">새 계정 등록</option>
                {filteredPlatforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* 계정명 */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <label className="w-32 shrink-0 text-sm text-muted-foreground">
              계정명
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="계정명을 입력하세요"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* 플랫폼별 필드 */}
          {fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
              <label className="w-32 shrink-0 text-sm text-muted-foreground">
                {field.label}
              </label>
              <input
                type={field.type || 'text'}
                value={formData[field.key] || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}

          {/* 플랫폼별 안내 */}
          {platformNotes[selectedPlatform] && (
            <p className="text-xs text-muted-foreground">
              {platformNotes[selectedPlatform]}
            </p>
          )}
        </div>

        {/* 블로그스팟 OAuth 연동 상태 */}
        {selectedPlatform === 'BLOGSPOT' && selectedAccountId && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  formData.accessToken ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm">
                  {formData.accessToken ? 'Google 계정 연동됨' : 'Google 계정 미연동'}
                </span>
              </div>
              <button
                onClick={() => {
                  window.location.href = `/api/auth/google?platformId=${selectedAccountId}`;
                }}
                className="rounded-lg bg-[#4285F4] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#3367D6] transition-colors"
              >
                {formData.accessToken ? 'Google 재연동' : 'Google 계정 연동'}
              </button>
            </div>
          </div>
        )}

        {/* 블로그스팟 새 계정 안내 */}
        {selectedPlatform === 'BLOGSPOT' && !selectedAccountId && (
          <p className="mt-4 text-xs text-muted-foreground">
            먼저 계정을 설정저장한 뒤 Google 계정 연동을 진행하세요.
          </p>
        )}

        {/* 네이버/티스토리 브라우저 로그인 + 세션 상태 */}
        {(selectedPlatform === 'NAVER' || selectedPlatform === 'TISTORY') && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  sessionStatus[selectedPlatform.toLowerCase()]?.valid ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm">
                  {sessionStatus[selectedPlatform.toLowerCase()]?.valid
                    ? `${selectedPlatform === 'NAVER' ? '네이버' : '티스토리'} 로그인됨`
                    : `${selectedPlatform === 'NAVER' ? '네이버' : '티스토리'} 로그인 필요`
                  }
                </span>
              </div>
              <button
                onClick={() => handleBrowserLogin(selectedPlatform.toLowerCase() as 'naver' | 'tistory')}
                disabled={browserLogin}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {browserLogin ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Monitor className="h-3.5 w-3.5" />
                )}
                {browserLogin ? '로그인 중...' : '브라우저 로그인'}
              </button>
            </div>
            {sessionStatus[selectedPlatform.toLowerCase()]?.valid && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                세션이 유효합니다. 글 발행이 가능합니다.
              </p>
            )}
            {!sessionStatus[selectedPlatform.toLowerCase()]?.valid && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                브라우저 로그인 버튼을 클릭하면 Chromium 브라우저가 열립니다. 직접 로그인해주세요.
              </p>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleTest}
            disabled={testing || !selectedAccountId}
            className="flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
            {testing ? '테스트 중...' : '연결테스트'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            설정저장
          </button>
        </div>
      </div>
    </div>
  );
}
