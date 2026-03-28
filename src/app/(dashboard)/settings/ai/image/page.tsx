'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plug, Save, Loader2, ImageIcon, Camera, Search, Sparkles, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

type ImageSource = {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  free: boolean;
  implemented: boolean;
  reuseKey?: string; // AI 설정 키 재활용 (예: 'ai_api_key_openai')
  fields: FieldConfig[];
};

type FieldConfig = {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select';
  placeholder: string;
  options?: string[];
};

const IMAGE_SOURCES: ImageSource[] = [
  {
    key: 'pixabay',
    label: 'Pixabay 이미지',
    description: '무료 고품질 이미지 검색 (API Key 필요)',
    icon: <ImageIcon className="h-5 w-5 text-white" />,
    iconBg: 'bg-[#4DB6AC]',
    free: true,
    implemented: true,
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Pixabay API Key' },
      { key: 'count', label: '이미지 수 (최대 20개)', type: 'number', placeholder: '8' },
    ],
  },
  {
    key: 'unsplash',
    label: 'Unsplash 이미지',
    description: '무료 고품질 스톡 이미지 (API Key 필요)',
    icon: <Camera className="h-5 w-5 text-white" />,
    iconBg: 'bg-[#111111]',
    free: true,
    implemented: true,
    fields: [
      { key: 'api_key', label: 'Access Key', type: 'password', placeholder: 'Unsplash Access Key' },
      { key: 'count', label: '이미지 수 (최대 20개)', type: 'number', placeholder: '8' },
    ],
  },
  {
    key: 'duckduckgo',
    label: 'DuckDuckGo 이미지',
    description: '무료 이미지 검색 (API Key 불필요)',
    icon: <Search className="h-5 w-5 text-white" />,
    iconBg: 'bg-[#DE5833]',
    free: true,
    implemented: false,
    fields: [
      { key: 'count', label: '이미지 수 (최대 20개)', type: 'number', placeholder: '8' },
    ],
  },
  {
    key: 'google',
    label: 'Google 이미지',
    description: '무료 구글 이미지 검색 (API Key 불필요)',
    icon: <Search className="h-5 w-5 text-white" />,
    iconBg: 'bg-[#4285F4]',
    free: true,
    implemented: false,
    fields: [
      { key: 'count', label: '이미지 수 (최대 20개)', type: 'number', placeholder: '8' },
    ],
  },
  {
    key: 'dalle',
    label: 'DALL-E 이미지',
    description: 'OpenAI AI 이미지 생성 (유료, OpenAI API Key 사용)',
    icon: <Sparkles className="h-5 w-5 text-white" />,
    iconBg: 'bg-[#10A37F]',
    free: false,
    implemented: true,
    reuseKey: 'ai_api_key_openai',
    fields: [
      { key: 'model', label: '모델', type: 'select', placeholder: 'dall-e-3', options: ['dall-e-3', 'dall-e-2'] },
      { key: 'size', label: '이미지 크기', type: 'select', placeholder: '1024x1024', options: ['1024x1024', '1024x1792', '1792x1024'] },
      { key: 'count', label: '이미지 수 (최대 5개)', type: 'number', placeholder: '2' },
    ],
  },
  {
    key: 'gemini_imagen',
    label: 'Gemini AI 이미지',
    description: 'Google AI 이미지 생성 (유료, Gemini API Key 사용)',
    icon: <Sparkles className="h-5 w-5 text-white" />,
    iconBg: 'bg-[#8E24AA]',
    free: false,
    implemented: true,
    reuseKey: 'ai_api_key_gemini',
    fields: [
      { key: 'count', label: '이미지 수 (최대 5개)', type: 'number', placeholder: '2' },
    ],
  },
  {
    key: 'ideogram',
    label: 'Ideogram AI 이미지',
    description: 'Ideogram AI 이미지 생성 (유료, 별도 API Key 필요)',
    icon: <Sparkles className="h-5 w-5 text-white" />,
    iconBg: 'bg-[#FF6B35]',
    free: false,
    implemented: false,
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Ideogram API Key' },
      { key: 'count', label: '이미지 수 (최대 5개)', type: 'number', placeholder: '2' },
    ],
  },
  {
    key: 'local',
    label: '내 이미지 폴더',
    description: '로컬에 저장된 이미지를 사용합니다',
    icon: <FolderOpen className="h-5 w-5 text-white" />,
    iconBg: 'bg-[#78909C]',
    free: true,
    implemented: false,
    fields: [
      { key: 'folder_path', label: '폴더 경로', type: 'text', placeholder: 'C:\\images\\blog' },
    ],
  },
];

type SourceStatus = 'connected' | 'no_key' | 'not_ready';

export default function ImageAIPage() {
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<Record<string, Record<string, string>>>({});
  const [aiKeys, setAiKeys] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  /** 소스의 연동 상태를 판별 */
  const getSourceStatus = (source: ImageSource): SourceStatus => {
    if (!source.implemented) return 'not_ready';
    // API Key 재활용 (DALL-E, Gemini)
    if (source.reuseKey && aiKeys[source.reuseKey]) return 'connected';
    // 자체 API Key 필드가 있는 소스
    const hasApiKeyField = source.fields.some((f) => f.key === 'api_key');
    if (hasApiKeyField) {
      return settings[source.key]?.api_key ? 'connected' : 'no_key';
    }
    // API Key 불필요한 구현 완료 소스
    return 'connected';
  };

  // 설정 로드
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        const parsed: Record<string, Record<string, string>> = {};

        for (const source of IMAGE_SOURCES) {
          parsed[source.key] = {};
          for (const field of source.fields) {
            const settingKey = `image_${source.key}_${field.key}`;
            if (data[settingKey]) {
              parsed[source.key][field.key] = data[settingKey];
            }
          }
        }

        setSettings(parsed);

        // AI 설정 키 (DALL-E/Gemini 재활용 판별용)
        const keys: Record<string, string> = {};
        if (data.ai_api_key_openai) keys.ai_api_key_openai = data.ai_api_key_openai;
        if (data.ai_api_key_gemini) keys.ai_api_key_gemini = data.ai_api_key_gemini;
        setAiKeys(keys);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleExpanded = (key: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updateField = (sourceKey: string, fieldKey: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [sourceKey]: { ...prev[sourceKey], [fieldKey]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};

      for (const source of IMAGE_SOURCES) {
        for (const field of source.fields) {
          payload[`image_${source.key}_${field.key}`] = settings[source.key]?.[field.key] || '';
        }
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('이미지 설정이 저장되었습니다');
      } else {
        toast.error('저장에 실패했습니다');
      }
    } catch {
      toast.error('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (sourceKey: string) => {
    const apiKey = settings[sourceKey]?.api_key;
    if (!apiKey) {
      toast.error('API Key를 입력해주세요');
      return;
    }

    setTesting(sourceKey);
    try {
      const res = await fetch('/api/images/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: sourceKey, apiKey }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('연결 성공!');
      } else {
        toast.error(data.error || '연결 실패');
      }
    } catch {
      toast.error('연결 테스트에 실패했습니다');
    } finally {
      setTesting(null);
    }
  };

  // API Key가 필요한 소스인지 확인
  const hasApiKeyField = (sourceKey: string) => {
    const source = IMAGE_SOURCES.find((s) => s.key === sourceKey);
    return source?.fields.some((f) => f.key === 'api_key') || false;
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
        <h1 className="text-2xl font-semibold">이미지 AI</h1>
        <p className="text-sm text-muted-foreground">
          블로그 이미지 소스를 설정합니다. 여러 소스를 동시에 활성화할 수 있습니다.
        </p>
      </div>

      {/* 유료 — AI 이미지 생성 */}
      <SourceSection
        title="유료 — AI 이미지 생성"
        sources={IMAGE_SOURCES.filter((s) => !s.free)}
        expandedSources={expandedSources}
        settings={settings}
        saving={saving}
        testing={testing}
        onToggleExpanded={toggleExpanded}
        onUpdateField={updateField}
        onSave={handleSave}
        onTest={handleTest}
        hasApiKeyField={hasApiKeyField}
        getSourceStatus={getSourceStatus}
      />

      {/* 무료 — API Key 필요 */}
      <SourceSection
        title="무료 — API Key 필요"
        sources={IMAGE_SOURCES.filter((s) => s.free && s.fields.some((f) => f.key === 'api_key'))}
        expandedSources={expandedSources}
        settings={settings}
        saving={saving}
        testing={testing}
        onToggleExpanded={toggleExpanded}
        onUpdateField={updateField}
        onSave={handleSave}
        onTest={handleTest}
        hasApiKeyField={hasApiKeyField}
        getSourceStatus={getSourceStatus}
      />

      {/* 무료 — API Key 불필요 */}
      <SourceSection
        title="무료 — API Key 불필요"
        sources={IMAGE_SOURCES.filter((s) => s.free && !s.fields.some((f) => f.key === 'api_key'))}
        expandedSources={expandedSources}
        settings={settings}
        saving={saving}
        testing={testing}
        onToggleExpanded={toggleExpanded}
        onUpdateField={updateField}
        onSave={handleSave}
        onTest={handleTest}
        hasApiKeyField={hasApiKeyField}
        getSourceStatus={getSourceStatus}
      />
    </div>
  );
}

/** 카테고리별 이미지 소스 섹션 */
function SourceSection({
  title,
  sources,
  expandedSources,
  settings,
  saving,
  testing,
  onToggleExpanded,
  onUpdateField,
  onSave,
  onTest,
  hasApiKeyField,
  getSourceStatus,
}: {
  title: string;
  sources: ImageSource[];
  expandedSources: Set<string>;
  settings: Record<string, Record<string, string>>;
  saving: boolean;
  testing: string | null;
  onToggleExpanded: (key: string) => void;
  onUpdateField: (sourceKey: string, fieldKey: string, value: string) => void;
  onSave: () => void;
  onTest: (sourceKey: string) => void;
  hasApiKeyField: (sourceKey: string) => boolean;
  getSourceStatus: (source: ImageSource) => SourceStatus;
}) {
  if (sources.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
      <div className="space-y-2">
        {sources.map((source) => {
          const isExpanded = expandedSources.has(source.key);
          const status = getSourceStatus(source);

          return (
            <div
              key={source.key}
              className={`rounded-xl border shadow-sm transition-colors ${
                status === 'connected' ? 'border-green-500/30 bg-card' :
                status === 'not_ready' ? 'border-border bg-card opacity-60' :
                'border-border bg-card'
              }`}
            >
              <button
                onClick={() => onToggleExpanded(source.key)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${source.iconBg}`}>
                  {source.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{source.label}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      source.free ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {source.free ? '무료' : '유료'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      status === 'connected' ? 'bg-green-500/10 text-green-500' :
                      status === 'no_key' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-gray-500/10 text-gray-400'
                    }`}>
                      {status === 'connected' ? '연동됨' :
                       status === 'no_key' ? '키 미등록' :
                       '준비 중'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{source.description}</p>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                  {source.fields.map((field) => (
                    <div key={field.key} className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                      <label className="w-44 shrink-0 text-sm text-muted-foreground">{field.label}</label>
                      {field.type === 'select' ? (
                        <div className="relative flex-1">
                          <select
                            value={settings[source.key]?.[field.key] || field.options?.[0] || ''}
                            onChange={(e) => onUpdateField(source.key, field.key, e.target.value)}
                            className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          value={settings[source.key]?.[field.key] || ''}
                          onChange={(e) => onUpdateField(source.key, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      )}
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    {hasApiKeyField(source.key) && (
                      <button
                        onClick={() => onTest(source.key)}
                        disabled={testing === source.key}
                        className="flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        {testing === source.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                        연결 테스트
                      </button>
                    )}
                    <button
                      onClick={onSave}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      설정저장
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
