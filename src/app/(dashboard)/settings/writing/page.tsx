'use client';


export default function WritingSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">글쓰기 설정</h1>
        <p className="text-sm text-muted-foreground">
          AI 글 생성 시 기본 설정을 관리합니다
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="space-y-5">
          {/* 기본 설정 */}
          <div className="flex flex-wrap items-center gap-4">
            <InlineField label="포스트 개수" value="1" width="w-16" />
            <InlineField label="글자수" value="1500" width="w-20" />
            <InlineField label="대기시간(초)" value="100" width="w-16" />
            <span className="text-sm text-muted-foreground">~</span>
            <InlineField label="" value="100" width="w-16" />
          </div>

          {/* 발행 설정 */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <label className="w-32 shrink-0 text-sm text-muted-foreground">
              발행설정
            </label>
            <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option>즉시 발행</option>
              <option>예약 발행</option>
              <option>초안 저장</option>
            </select>
          </div>

          <button className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
            설정저장
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineField({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <label className="text-sm text-muted-foreground">{label}</label>
      )}
      <input
        type="number"
        defaultValue={value}
        className={`${width} rounded-lg border border-input bg-background px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring`}
      />
    </div>
  );
}
