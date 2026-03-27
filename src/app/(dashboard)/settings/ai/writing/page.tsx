'use client';

import { useState, useEffect } from 'react';
import { Bot, Plug, Plus, Pencil, Trash2, ChevronDown, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

type Prompt = {
  id: string;
  name: string;
  content: string;
};

const AI_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-haiku-4-5-20251001',
  'claude-opus-4-20250514',
];

export default function WritingAIPage() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(AI_MODELS[0]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 설정 로드
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.ai_api_key) setApiKey(data.ai_api_key);
        if (data.ai_model) setModel(data.ai_model);
        if (data.ai_prompts) {
          try {
            setPrompts(JSON.parse(data.ai_prompts));
          } catch {
            // 파싱 실패 시 기본 프롬프트
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // 기본 프롬프트 (DB에 없을 때)
  useEffect(() => {
    if (!loading && prompts.length === 0) {
      setPrompts([
        {
          id: '1',
          name: '기본 블로그 글',
          content: '{keyword}을(를) 주제로 {tone} 톤의 블로그 글을 {length}자 내외로 작성해줘. 소제목을 포함하고 HTML 형식으로 출력해줘.',
        },
        {
          id: '2',
          name: '리뷰 글',
          content: '{keyword}에 대한 상세 리뷰를 작성해줘. 장점, 단점, 총평을 포함하고 {tone} 톤으로 {length}자 내외 HTML 형식으로 출력해줘.',
        },
      ]);
    }
  }, [loading, prompts.length]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_api_key: apiKey,
          ai_model: model,
          ai_prompts: JSON.stringify(prompts),
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

  const handleAddPrompt = () => {
    setEditingPrompt({ id: '', name: '', content: '' });
    setShowPromptForm(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt({ ...prompt });
    setShowPromptForm(true);
  };

  const handleSavePrompt = () => {
    if (!editingPrompt || !editingPrompt.name.trim() || !editingPrompt.content.trim()) return;

    if (editingPrompt.id) {
      setPrompts((prev) =>
        prev.map((p) => (p.id === editingPrompt.id ? editingPrompt : p)),
      );
    } else {
      setPrompts((prev) => [
        ...prev,
        { ...editingPrompt, id: Date.now().toString() },
      ]);
    }
    setEditingPrompt(null);
    setShowPromptForm(false);
  };

  const handleDeletePrompt = (id: string) => {
    if (!confirm('이 프롬프트를 삭제하시겠습니까?')) return;
    setPrompts((prev) => prev.filter((p) => p.id !== id));
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
        <h1 className="text-2xl font-semibold">글쓰기 AI</h1>
        <p className="text-sm text-muted-foreground">
          AI 글 생성 모델과 프롬프트를 설정합니다
        </p>
      </div>

      {/* Claude API 설정 */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4A574]">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium">Claude</p>
            <p className="text-xs text-muted-foreground">
              Anthropic의 AI 모델로 고품질 한국어 콘텐츠를 생성합니다
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <label className="w-32 shrink-0 text-sm text-muted-foreground">모델 선택</label>
          <div className="relative flex-1">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {AI_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-2 text-sm font-medium">API 설정</legend>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <label className="w-32 shrink-0 text-sm text-muted-foreground">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </fieldset>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <Plug className="h-4 w-4" />
            연결 테스트
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            설정저장
          </button>
        </div>
      </div>

      {/* 프롬프트 관리 */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">프롬프트 관리</h2>
            <p className="text-xs text-muted-foreground">
              글 생성 시 사용할 프롬프트 템플릿을 관리합니다. 변수: {'{keyword}'}, {'{tone}'}, {'{length}'}
            </p>
          </div>
          <button
            onClick={handleAddPrompt}
            className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            새 프롬프트
          </button>
        </div>

        {/* 프롬프트 목록 */}
        <div className="space-y-2">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="flex items-start justify-between rounded-lg border border-border p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{prompt.name}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {prompt.content}
                </p>
              </div>
              <div className="ml-3 flex shrink-0 gap-1">
                <button
                  onClick={() => handleEditPrompt(prompt)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeletePrompt(prompt.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {prompts.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              등록된 프롬프트가 없습니다
            </p>
          )}
        </div>

        {/* 프롬프트 추가/수정 폼 */}
        {showPromptForm && editingPrompt && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <p className="text-sm font-medium">
              {editingPrompt.id ? '프롬프트 수정' : '새 프롬프트 추가'}
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">프롬프트 이름</label>
              <input
                type="text"
                value={editingPrompt.name}
                onChange={(e) =>
                  setEditingPrompt({ ...editingPrompt, name: e.target.value })
                }
                placeholder="예: 기본 블로그 글"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">프롬프트 내용</label>
              <textarea
                value={editingPrompt.content}
                onChange={(e) =>
                  setEditingPrompt({ ...editingPrompt, content: e.target.value })
                }
                placeholder="예: {keyword}을(를) 주제로 {tone} 톤의 블로그 글을 {length}자 내외로 작성해줘."
                rows={4}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSavePrompt}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setShowPromptForm(false);
                  setEditingPrompt(null);
                }}
                className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-muted transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 프롬프트 변경 후 설정저장 안내 */}
        <p className="text-xs text-muted-foreground">
          프롬프트를 추가/수정/삭제한 후 상단의 <strong>설정저장</strong> 버튼을 눌러야 반영됩니다.
        </p>
      </div>
    </div>
  );
}
