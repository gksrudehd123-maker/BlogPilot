'use client';

import { ImageIcon, Camera, Plug, ChevronDown } from 'lucide-react';

export default function ImageAIPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">이미지 AI</h1>
        <p className="text-sm text-muted-foreground">
          블로그 이미지 생성 및 검색 서비스를 설정합니다
        </p>
      </div>

      {/* DALL-E 설정 */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10A37F]">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium">DALL-E</p>
            <p className="text-xs text-muted-foreground">
              OpenAI의 이미지 생성 모델로 블로그 이미지를 자동 생성합니다
            </p>
          </div>
        </div>

        <FormField label="모델 선택" type="select" placeholder="dall-e-3" />

        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-2 text-sm font-medium">API 설정</legend>
          <div className="space-y-4">
            <FormField label="API Key" placeholder="sk-..." type="password" />
          </div>
        </fieldset>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <Plug className="h-4 w-4" />
            연결 테스트
          </button>
          <button className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
            설정저장
          </button>
        </div>
      </div>

      {/* Unsplash 설정 */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#111111]">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium">Unsplash</p>
            <p className="text-xs text-muted-foreground">
              무료 고품질 스톡 이미지를 검색하고 블로그에 삽입합니다
            </p>
          </div>
        </div>

        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-2 text-sm font-medium">API 설정</legend>
          <div className="space-y-4">
            <FormField label="Access Key" placeholder="Unsplash Access Key" type="password" />
          </div>
        </fieldset>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <Plug className="h-4 w-4" />
            연결 테스트
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
            <option>{placeholder}</option>
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
