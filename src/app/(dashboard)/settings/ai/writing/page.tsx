'use client';

import { useState } from 'react';
import { Bot, Plug, Plus, Pencil, Trash2, ChevronDown } from 'lucide-react';

const defaultPrompts = [
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
];

export default function WritingAIPage() {
  const [prompts, setPrompts] = useState(defaultPrompts);
  const [editingPrompt, setEditingPrompt] = useState<{ id: string; name: string; content: string } | null>(null);
  const [showPromptForm, setShowPromptForm] = useState(false);

  const handleAddPrompt = () => {
    setEditingPrompt({ id: '', name: '', content: '' });
    setShowPromptForm(true);
  };

  const handleEditPrompt = (prompt: typeof defaultPrompts[0]) => {
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

        <FormField label="모델 선택" type="select" placeholder="claude-sonnet-4-20250514" />

        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-2 text-sm font-medium">API 설정</legend>
          <div className="space-y-4">
            <FormField label="API Key" placeholder="sk-ant-..." type="password" />
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
