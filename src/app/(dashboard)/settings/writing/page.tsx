'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function WritingSettingsPage() {
  const [postCount, setPostCount] = useState('1');
  const [charLength, setCharLength] = useState('1500');
  const [delayMin, setDelayMin] = useState('100');
  const [delayMax, setDelayMax] = useState('100');
  const [publishMode, setPublishMode] = useState('즉시 발행');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.writing_post_count) setPostCount(data.writing_post_count);
        if (data.writing_char_length) setCharLength(data.writing_char_length);
        if (data.writing_delay_min) setDelayMin(data.writing_delay_min);
        if (data.writing_delay_max) setDelayMax(data.writing_delay_max);
        if (data.writing_publish_mode) setPublishMode(data.writing_publish_mode);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          writing_post_count: postCount,
          writing_char_length: charLength,
          writing_delay_min: delayMin,
          writing_delay_max: delayMax,
          writing_publish_mode: publishMode,
        }),
      });
      if (res.ok) {
        toast.success('설정이 저장되었습니다');
      } else {
        toast.error('저장에 실패했습니다');
      }
    } catch {
      toast.error('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">포스트 개수</label>
              <input
                type="number"
                value={postCount}
                onChange={(e) => setPostCount(e.target.value)}
                className="w-16 rounded-lg border border-input bg-background px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">글자수</label>
              <input
                type="number"
                value={charLength}
                onChange={(e) => setCharLength(e.target.value)}
                className="w-20 rounded-lg border border-input bg-background px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">대기시간(초)</label>
              <input
                type="number"
                value={delayMin}
                onChange={(e) => setDelayMin(e.target.value)}
                className="w-16 rounded-lg border border-input bg-background px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">~</span>
              <input
                type="number"
                value={delayMax}
                onChange={(e) => setDelayMax(e.target.value)}
                className="w-16 rounded-lg border border-input bg-background px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* 발행 설정 */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <label className="w-32 shrink-0 text-sm text-muted-foreground">
              발행설정
            </label>
            <select
              value={publishMode}
              onChange={(e) => setPublishMode(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option>즉시 발행</option>
              <option>예약 발행</option>
              <option>초안 저장</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            설정저장
          </button>
        </div>
      </div>
    </div>
  );
}
