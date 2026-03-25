'use client';

import { useState } from 'react';
import { Globe, Plus, Pencil, Trash2, Plug, ChevronDown } from 'lucide-react';

const platformOptions = [
  { value: 'NAVER', label: '네이버 블로그', color: '#03C75A' },
  { value: 'WORDPRESS', label: '워드프레스', color: '#21759B' },
  { value: 'BLOGSPOT', label: '블로그스팟', color: '#FF6F00' },
  { value: 'TISTORY', label: '티스토리', color: '#FF5A4A' },
];

export default function SiteSettingsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('NAVER');
  const current = platformOptions.find((p) => p.value === selectedPlatform)!;

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
            <button className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm hover:bg-muted transition-colors">
              <Plus className="h-3.5 w-3.5" />
              계정 추가
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm hover:bg-muted transition-colors">
              <Pencil className="h-3.5 w-3.5" />
              계정 편집
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
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
            <p className="text-xs text-muted-foreground">계정 미등록</p>
          </div>
        </div>

        {/* 계정 정보 폼 */}
        <div className="mt-6 space-y-4">
          {selectedPlatform === 'NAVER' && (
            <>
              <FormField label="계정 선택" placeholder="계정을 선택하세요" type="select" />
              <FormField label="계정명" placeholder="계정명을 입력하세요" />
              <FormField label="도메인" placeholder="블로그 도메인 (예: myblog)" />
              <FormField label="아이디" placeholder="네이버 아이디" />
              <FormField label="비밀번호" placeholder="비밀번호" type="password" />
              <FormField label="카테고리" placeholder="기본 카테고리" />
            </>
          )}
          {selectedPlatform === 'WORDPRESS' && (
            <>
              <FormField label="계정 선택" placeholder="계정을 선택하세요" type="select" />
              <FormField label="계정명" placeholder="계정명을 입력하세요" />
              <FormField label="사이트 URL" placeholder="https://your-site.com" />
              <FormField label="사용자명" placeholder="WordPress 사용자명" />
              <FormField label="Application Password" placeholder="Application Password" type="password" />
              <FormField label="카테고리" placeholder="기본 카테고리" />
            </>
          )}
          {selectedPlatform === 'BLOGSPOT' && (
            <>
              <FormField label="계정 선택" placeholder="계정을 선택하세요" type="select" />
              <FormField label="계정명" placeholder="계정명을 입력하세요" />
              <FormField label="블로그 ID" placeholder="Blogger 블로그 ID" />
              <FormField label="라벨" placeholder="기본 라벨" />
              <p className="text-xs text-muted-foreground">
                Google OAuth 2.0으로 인증합니다. 연결테스트 시 Google 로그인이 필요합니다.
              </p>
            </>
          )}
          {selectedPlatform === 'TISTORY' && (
            <>
              <FormField label="계정 선택" placeholder="계정을 선택하세요" type="select" />
              <FormField label="계정명" placeholder="계정명을 입력하세요" />
              <FormField label="블로그명" placeholder="티스토리 블로그명" />
              <FormField label="아이디" placeholder="카카오 계정 이메일" />
              <FormField label="비밀번호" placeholder="비밀번호" type="password" />
              <FormField label="카테고리" placeholder="기본 카테고리" />
              <p className="text-xs text-muted-foreground">
                티스토리 API가 종료되어 브라우저 자동화로 발행합니다. 데스크톱 앱에서만 사용 가능합니다.
              </p>
            </>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mt-6 flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <Plug className="h-4 w-4" />
            연결테스트
          </button>
          <button className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
            설정저장
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  placeholder,
  type = 'text',
}: {
  label: string;
  placeholder: string;
  type?: 'text' | 'password' | 'select';
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
      <label className="w-32 shrink-0 text-sm text-muted-foreground">
        {label}
      </label>
      {type === 'select' ? (
        <div className="relative flex-1">
          <select className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">{placeholder}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
    </div>
  );
}
