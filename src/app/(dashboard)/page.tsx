'use client';

import { FileText, CheckCircle, CalendarClock, TrendingUp } from 'lucide-react';

const kpiCards = [
  { label: '총 발행', value: '0건', icon: FileText, color: 'text-blue-500' },
  { label: '성공률', value: '0%', icon: CheckCircle, color: 'text-green-500' },
  { label: '예약 대기', value: '0건', icon: CalendarClock, color: 'text-amber-500' },
  { label: '이번 주', value: '0건', icon: TrendingUp, color: 'text-violet-500' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">통계</h1>
        <p className="text-sm text-muted-foreground">
          발행 현황과 통계를 한눈에 확인합니다
        </p>
      </div>

      {/* KPI 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          아직 발행된 글이 없습니다
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          플랫폼을 연동하고 첫 글을 작성해보세요!
        </p>
      </div>
    </div>
  );
}
