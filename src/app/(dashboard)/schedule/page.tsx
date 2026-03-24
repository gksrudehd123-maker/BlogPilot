'use client';

import { CalendarClock } from 'lucide-react';

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">예약 발행</h1>
        <p className="text-sm text-muted-foreground">
          예약된 글과 발행 스케줄을 관리합니다
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          예약된 발행이 없습니다
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          글 관리에서 예약 발행을 설정해보세요
        </p>
      </div>
    </div>
  );
}
