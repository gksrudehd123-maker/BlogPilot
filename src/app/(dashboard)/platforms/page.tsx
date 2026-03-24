'use client';

import { Link2, Plus } from 'lucide-react';

const platformTypes = [
  { name: '네이버 블로그', color: 'bg-[#03C75A]' },
  { name: '티스토리', color: 'bg-[#FF5A4A]' },
  { name: '워드프레스', color: 'bg-[#21759B]' },
  { name: '블로그스팟', color: 'bg-[#FF6F00]' },
];

export default function PlatformsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">플랫폼 관리</h1>
          <p className="text-sm text-muted-foreground">
            블로그 플랫폼을 연동하고 관리합니다
          </p>
        </div>
        <button className="flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          플랫폼 연동
        </button>
      </div>

      {/* 플랫폼 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {platformTypes.map((p) => (
          <div
            key={p.name}
            className="rounded-xl border border-dashed border-border p-6 text-center transition-colors hover:bg-muted/50 cursor-pointer"
          >
            <div className={`mx-auto h-10 w-10 rounded-full ${p.color} flex items-center justify-center`}>
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <p className="mt-3 text-sm font-medium">{p.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">미연동</p>
          </div>
        ))}
      </div>
    </div>
  );
}
