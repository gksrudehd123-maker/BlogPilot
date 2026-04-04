# BlogPilot - Multi-Platform Blog Automation System

> AI 기반 다중 플랫폼 블로그 자동화 시스템

---

## 프로젝트 개요

네이버 블로그, 티스토리, 워드프레스, 블로그스팟 4개 플랫폼에 AI로 생성한 콘텐츠를 자동 발행하는 시스템입니다. 키워드 리서치부터 글 생성, 이미지 삽입, 예약 발행까지 블로그 운영의 전 과정을 자동화합니다.

### 핵심 기능

- **AI 글 생성**: 멀티 AI 지원 (Claude / OpenAI / Gemini) ✅ 3개 제공자 연동 완료 + 본문 기반 구조 분석 생성
- **다중 플랫폼 발행**: 네이버 블로그, 티스토리, 워드프레스, 블로그스팟 ✅
- **브라우저 자동화**: Playwright로 네이버/티스토리 자동 로그인 + 발행 ✅
- **글 관리**: 초안 CRUD, 발행 이력, 본문 편집/미리보기, 설정 저장 ✅
- **이미지 자동 삽입**: DALL-E + Unsplash (Phase C 예정)
- **예약 발행**: 날짜/시간 지정 예약 + 반복 스케줄 (Phase C 예정)
- **키워드 리서치**: 네이버 검색량/경쟁도 분석 (Phase D 예정)

---

## 지원 플랫폼

| 플랫폼 | 연동 방식 | 인증 | 글 작성 |
|--------|----------|------|--------|
| **워드프레스** | REST API | Application Password | ✅ 발행 완료 |
| **블로그스팟** | Google Blogger API | Google OAuth 2.0 | ✅ 발행 완료 |
| **티스토리** | Playwright 브라우저 자동화 | 카카오 로그인 (쿠키) | ✅ dry run 완료 (로컬 전용) |
| **네이버 블로그** | Playwright 브라우저 자동화 | 네이버 로그인 (쿠키) | ✅ dry run 완료 (로컬 전용) |

---

## 개발 환경

### 요구사항

- Node.js 20.x LTS 이상
- pnpm 9.x 이상
- PostgreSQL 16.x (또는 Supabase)

### 기술 스택

| 구분 | 기술 | 설명 |
|------|------|------|
| **Framework** | Next.js 14 (App Router) | React 기반 풀스택 프레임워크 |
| **Language** | TypeScript 5 | 타입 안정성 확보 |
| **Styling** | Tailwind CSS 3 + shadcn/ui | 유틸리티 CSS + Radix UI 기반 컴포넌트 |
| **Database** | PostgreSQL (Supabase) | 매니지드 PostgreSQL |
| **ORM** | Prisma 5 | Type-safe 데이터베이스 ORM |
| **AI 글 생성** | Claude / OpenAI / Gemini | 멀티 AI 한국어 콘텐츠 생성 |
| **브라우저 자동화** | Playwright | 네이버/티스토리 자동 발행 (로컬 전용) |
| **Server State** | TanStack Query 5 | API 데이터 캐싱, 자동 갱신 |
| **Toast** | sonner | 알림 토스트 UI |
| **Theme** | next-themes | 다크모드/라이트모드/시스템 |
| **Mobile** | PWA (next-pwa) | 모바일 앱처럼 설치 가능 |

### 개발 도구

| 도구 | 용도 |
|------|------|
| **pnpm** | 패키지 매니저 |
| **ESLint + Prettier** | 코드 린팅 및 포맷팅 |
| **Prisma CLI** | DB 마이그레이션 및 스키마 관리 |

### 로컬 실행

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env.local

# DB 마이그레이션
pnpm prisma migrate dev

# 개발 서버 실행
pnpm dev
```

### 환경 변수

```env
# Database (Supabase)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# AI - 글 생성 (설정 페이지에서 DB에 저장하는 것을 권장)
ANTHROPIC_API_KEY=...              # Claude API (선택)
OPENAI_API_KEY=...                 # OpenAI API (선택)
GEMINI_API_KEY=...                 # Gemini API (선택)

# 블로그스팟 (Google OAuth)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# 워드프레스 / 네이버 / 티스토리는 UI에서 계정 등록
# 네이버/티스토리는 Playwright 브라우저 로그인으로 인증 (쿠키 저장)
```

---

## 아키텍처

### 시스템 구조

```
┌─────────────────────────────────────────────────────────┐
│                    BlogPilot (Next.js)                    │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Web UI     │  │   PWA 모바일  │  │  API Routes    │  │
│  │  (PC 대시보드)│  │  (모바일 앱)  │  │  (백엔드)      │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         └────────────────┴──────────────────┘            │
│                          ↕                                │
│  ┌───────────────────────────────────────────────────┐   │
│  │                  서비스 레이어                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │   │
│  │  │ AI 엔진  │ │ 스케줄러  │ │  키워드 리서치    │  │   │
│  │  │Claude/   │ │ (Cron)   │ │  (네이버 검색)    │  │   │
│  │  │OpenAI/   │ │          │ │                   │  │   │
│  │  │Gemini    │ │          │ │                   │  │   │
│  │  └──────────┘ └──────────┘ └───────────────────┘  │   │
│  └───────────────────────────────────────────────────┘   │
│                          ↕                                │
│  ┌───────────────────────────────────────────────────┐   │
│  │               플랫폼 어댑터 레이어                  │   │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │  │ 네이버  │ │ 티스토리│ │ 워드프레스│ │ 블로그스팟│ │   │
│  │  └────────┘ └────────┘ └──────────┘ └──────────┘ │   │
│  └───────────────────────────────────────────────────┘   │
│                          ↕                                │
│              ┌──────────────────────┐                     │
│              │  PostgreSQL (Supabase)│                     │
│              └──────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

### 콘텐츠 생성 플로우 (현재 구현)

```
1. AI 글 생성 (2가지 모드)
   ├→ [키워드 기반] 키워드 + 프롬프트 + 톤/글자수 + AI 선택 → HTML 글 생성
   └→ [본문 기반]  참고 글 붙여넣기 → AI가 구조 분석 → 새 주제로 완전히 새 글 생성
      └→ 추가 지시 프롬프트 (선택), 확대 모달 편집 지원

2. 발행
   └→ 플랫폼 선택 → 즉시 발행 → 결과(성공 URL / 실패 메시지) 표시
   └→ 워드프레스/블로그스팟: API 호출
   └→ 네이버/티스토리: Playwright 브라우저 자동화 (로컬 전용)

3. 발행 로그 저장
   └→ Post + PublishLog DB 저장 (성공/실패 상태, URL, 에러 메시지)
```

### 디렉토리 구조

```
BlogPilot/
├── public/                         # 정적 파일 + PWA 매니페스트
├── prisma/
│   └── schema.prisma               # DB 스키마
├── cookies/                        # 브라우저 로그인 세션 (.gitignore)
├── scripts/                        # 테스트/분석 스크립트
├── src/
│   ├── app/
│   │   ├── (dashboard)/            # 대시보드 레이아웃 그룹
│   │   │   ├── page.tsx            # 대시보드 (KPI — 미연동)
│   │   │   ├── posts/              # 글쓰기 + AI 생성 + 발행
│   │   │   ├── schedule/           # 예약 발행 (미구현)
│   │   │   ├── platforms/          # (redirect → settings/sites)
│   │   │   ├── keywords/
│   │   │   │   ├── analysis/       # 키워드분석 (미구현)
│   │   │   │   └── search/         # 키워드검색 (미구현)
│   │   │   └── settings/
│   │   │       ├── sites/          # 사이트 설정 (4개 플랫폼 계정 관리)
│   │   │       ├── ai/             # AI 설정 (글쓰기 AI / 이미지 AI)
│   │   │       └── writing/        # 글쓰기 설정
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── google/         # 블로그스팟 Google OAuth
│   │       │   ├── callback/google # OAuth 콜백
│   │       │   ├── browser-login/  # Playwright 수동 로그인
│   │       │   └── session-check/  # 세션 유효성 체크
│   │       ├── ai/test/            # AI 연결 테스트 (Claude/OpenAI/Gemini)
│   │       ├── images/search/     # 이미지 키워드 검색 (Pixabay/Unsplash)
│   │       ├── images/test/       # 이미지 소스 연결 테스트
│   │       ├── posts/generate/     # AI 글 생성 (멀티 AI 제공자 분기)
│   │       ├── publish/            # 4개 플랫폼 발행
│   │       └── platforms/          # 플랫폼 계정 CRUD + 연결테스트
│   ├── components/
│   │   ├── ui/                     # shadcn/ui 컴포넌트
│   │   ├── layout/                 # 사이드바, 헤더
│   │   └── providers/              # ThemeProvider, QueryProvider
│   └── lib/
│       ├── prisma.ts
│       ├── auth-temp.ts            # 임시 인증 헬퍼 (Phase E에서 NextAuth로 교체)
│       ├── google-oauth.ts         # 블로그스팟 Google OAuth
│       ├── ai/
│       │   ├── index.ts            # AI 제공자 분기 (공통 인터페이스)
│       │   ├── claude.ts           # Claude API 클라이언트
│       │   ├── openai.ts           # OpenAI API 클라이언트
│       │   └── gemini.ts           # Gemini API 클라이언트
│       ├── image/
│       │   ├── index.ts            # 이미지 소스 분기 (공통 인터페이스)
│       │   ├── pixabay.ts          # Pixabay 이미지 검색
│       │   ├── unsplash.ts         # Unsplash 이미지 검색
│       │   ├── dalle.ts            # DALL-E 이미지 생성
│       │   └── gemini.ts           # Gemini Imagen 이미지 생성
│       ├── platforms/              # 플랫폼 발행/테스트
│       │   ├── publish.ts          # 공통 발행 함수 (4개 플랫폼 분기)
│       │   ├── test-connection.ts  # 공통 연결 테스트 함수
│       │   ├── blogspot.ts         # 블로그스팟 Blogger API
│       │   └── wordpress.ts        # 워드프레스 REST API
│       └── browser/                # Playwright 브라우저 자동화 (로컬 전용)
│           ├── session-manager.ts  # 쿠키 저장/로드/세션 체크
│           ├── naver-automation.ts # 네이버 SmartEditor 자동화
│           └── tistory-automation.ts # 티스토리 TinyMCE 자동화
├── package.json
└── README.md
```

### 데이터 모델

```
┌──────────────────┐     ┌──────────────────┐
│      User        │     │    Platform      │
├──────────────────┤     ├──────────────────┤
│ id               │     │ id               │
│ email            │     │ type (enum)      │
│ password         │     │ name             │
│ name             │     │ credentials      │
│ role             │     │ isActive         │
└──────┬───────────┘     │ userId FK        │
       │                  └──────┬───────────┘
       │                         │
┌──────┴───────────┐     ┌──────┴───────────┐
│      Post        │     │  PublishLog      │
├──────────────────┤     ├──────────────────┤
│ id               │     │ id               │
│ title            │     │ postId FK        │
│ content          │     │ platformId FK    │
│ status (enum)    │     │ status (enum)    │
│ keyword          │     │ publishedUrl     │
│ images[]         │     │ publishedAt      │
│ scheduledAt      │     │ errorMessage     │
│ userId FK        │     └──────────────────┘
└──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│    Keyword       │     │  KeywordStat     │
├──────────────────┤     ├──────────────────┤
│ id               │     │ id               │
│ keyword          │     │ keywordId FK     │
│ searchVolume     │     │ date             │
│ competition      │     │ rank             │
│ userId FK        │     │ searchVolume     │
└──────────────────┘     └──────────────────┘

Status: DRAFT → SCHEDULED → PUBLISHING → PUBLISHED → FAILED
Platform Type: NAVER | TISTORY | WORDPRESS | BLOGSPOT
```

---

## 배포 환경

현재 로컬 개발 환경에서 운영 중. Phase E에서 Vercel 배포 예정.

| 구분 | 서비스 | 상태 |
|------|--------|------|
| **Database** | Supabase (서울 리전) | ✅ 운영 중 |
| **Frontend + API** | 로컬 (localhost:3000) | Phase E에서 Vercel 배포 |
| **브라우저 자동화** | 로컬 Playwright | 네이버/티스토리 발행 (Vercel 불가) |

---

## 디자인 가이드

### 컬러 시스템

| 용도 | 라이트 모드 | 다크 모드 |
|------|------------|----------|
| **Primary** | `#2563EB` (Blue 600) | `#3B82F6` (Blue 500) |
| **Secondary** | `#8B5CF6` (Violet 500) | `#A78BFA` (Violet 400) |
| **Success** | `#16A34A` (Green 600) | `#22C55E` (Green 500) |
| **Warning** | `#D97706` (Amber 600) | `#F59E0B` (Amber 500) |
| **Danger** | `#DC2626` (Red 600) | `#EF4444` (Red 500) |
| **Background** | `#FFFFFF` | `#0F172A` (Slate 900) |
| **Surface** | `#F8FAFC` (Slate 50) | `#1E293B` (Slate 800) |
| **Text** | `#0F172A` (Slate 900) | `#F1F5F9` (Slate 100) |
| **Muted** | `#64748B` (Slate 500) | `#94A3B8` (Slate 400) |
| **Border** | `#E2E8F0` (Slate 200) | `#334155` (Slate 700) |

### 플랫폼별 브랜드 컬러

| 플랫폼 | 컬러 | 용도 |
|--------|------|------|
| 네이버 | `#03C75A` | 배지, 아이콘 |
| 티스토리 | `#FF5A4A` | 배지, 아이콘 |
| 워드프레스 | `#21759B` | 배지, 아이콘 |
| 블로그스팟 | `#FF6F00` | 배지, 아이콘 |

### 타이포그래피

| 용도 | 스타일 |
|------|--------|
| **H1 (페이지 제목)** | text-2xl font-semibold (24px) |
| **H2 (섹션 제목)** | text-lg font-semibold (18px) |
| **H3 (카드 제목)** | text-base font-medium (16px) |
| **Body** | text-sm (14px) |
| **Caption** | text-xs text-muted-foreground (12px) |
| **폰트** | Pretendard (한글) + Inter (영문) — 시스템 폰트 폴백 |

### 레이아웃

```
┌─────────────────────────────────────────────────┐
│ Header (h-14)                              [👤] │
├────────┬────────────────────────────────────────┤
│        │                                        │
│ Side   │          Main Content                  │
│ bar    │          (p-6)                          │
│ (w-60) │                                        │
│        │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│ 축소:  │  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │  │
│ (w-16) │  │ Card │ │ Card │ │ Card │ │ Card │  │
│        │  └──────┘ └──────┘ └──────┘ └──────┘  │
│        │                                        │
│        │  ┌─────────────────────────────────┐   │
│        │  │     차트/테이블/에디터 영역       │   │
│        │  │                                 │   │
│        │  └─────────────────────────────────┘   │
│        │                                        │
├────────┴────────────────────────────────────────┤
│ Mobile: 사이드바 → 햄버거 메뉴                    │
└─────────────────────────────────────────────────┘
```

### 컴포넌트 스타일

| 컴포넌트 | 스타일 |
|---------|--------|
| **카드** | `rounded-xl border border-border bg-card p-4 shadow-sm` |
| **버튼 (Primary)** | `rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90` |
| **버튼 (Secondary)** | `rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted` |
| **입력 필드** | `rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring` |
| **배지** | `rounded-full px-2 py-0.5 text-xs font-medium` |
| **테이블** | `overflow-x-auto rounded-xl border border-border bg-card shadow-sm` |
| **다이얼로그** | shadcn/ui Dialog (`sm:max-w-[440px]`) |
| **토스트** | sonner `richColors position="top-right"` |

### 상태 배지 컬러

| 상태 | 컬러 |
|------|------|
| DRAFT (초안) | `bg-gray-100 text-gray-600` |
| SCHEDULED (예약) | `bg-blue-100 text-blue-700` |
| PUBLISHING (발행 중) | `bg-yellow-100 text-yellow-700` |
| PUBLISHED (완료) | `bg-green-100 text-green-700` |
| FAILED (실패) | `bg-red-100 text-red-700` |

### 반응형 브레이크포인트

| 브레이크포인트 | 크기 | 적용 |
|--------------|------|------|
| **Mobile** | < 768px | 사이드바 → 햄버거, 카드 1열, 테이블 가로 스크롤 |
| **Tablet** | 768px ~ 1024px | 사이드바 축소, 카드 2열 |
| **Desktop** | > 1024px | 사이드바 확장, 카드 3~4열 |

---

## TODO 리스트

### 완료된 기능

#### Phase 1 - 프로젝트 초기 설정 + 레이아웃 (완료)
- [x] Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui 프로젝트 설정
- [x] Prisma 5 + Supabase PostgreSQL 연동 (서울 리전)
- [x] 초기 DB 스키마 (User, Platform, Post, PublishLog, Keyword, KeywordStat, Setting)
- [x] 대시보드 레이아웃 (사이드바 확장/축소 + 헤더 + 다크모드)
- [x] 모바일 반응형 (사이드바 → 햄버거 메뉴)
- [x] PWA 설정 (next-pwa, manifest, service worker)
- [x] 빈 상태 페이지 6개 (대시보드, 글 관리, 예약 발행, 키워드, 플랫폼, 설정)
- [x] 공통 유틸 (ThemeProvider, QueryProvider, ProgressBar, sonner Toast)
- [x] Pretendard 폰트 + Blue primary 디자인 시스템

#### Phase 1.5 - UI 리디자인 (완료)
- [x] 다크 테마 기본 적용 + 시안 블루 포인트 컬러
- [x] 사이드바 트리 구조 리팩토링 (설정/키워드/글쓰기 그룹 + 통계)
- [x] 라우트 구조 재배치 (settings/sites, settings/ai, settings/writing, keywords/analysis, keywords/search)
- [x] 사이트 설정 페이지 (4개 플랫폼 드롭다운 + 계정 관리 폼 + 연결테스트)
- [x] AI 설정 페이지 (Claude/DALL-E/Unsplash 탭 전환)
- [x] 글쓰기 설정 페이지 (인라인 폼 — 포스트 개수, 글자수, 대기시간)
- [x] 기존 /platforms, /keywords, /settings → 새 경로로 redirect

#### Phase 2 - 플랫폼 연동 (완료)
- [x] 플랫폼 계정 CRUD API + 사이트 설정 UI 연동
- [x] 블로그스팟: Google OAuth 2.0 + Blogger API (발행/연결테스트 완료)
- [x] 워드프레스: REST API + Application Password (발행/연결테스트 완료)
- [x] 네이버/티스토리: 계정 정보 저장 UI (발행은 Phase A에서 구현)
- [x] 임시 인증 헬퍼 (Phase E에서 NextAuth로 교체 예정)

#### Phase 3 - AI 글 생성 + 발행 (완료)
- [x] AI 설정 페이지 분리 (/settings/ai/writing, /settings/ai/image)
- [x] Claude API 클라이언트 (키워드 + 프롬프트 → 블로그 글 생성)
- [x] 글쓰기 페이지 (키워드 입력, 프롬프트 선택, 톤/글자수, AI 생성, 미리보기/편집)
- [x] 블로그스팟/워드프레스 발행 + 발행 로그 DB 저장

---

### Phase A - 4개 플랫폼 발행 완성
> 네이버/티스토리 Playwright 자동화 → 기존 발행 점검 → 공통 어댑터 패턴 리팩토링.
> Playwright는 로컬 전용 (Vercel 실행 불가). 수동 로그인 1회 → 쿠키 저장 → 재사용 방식.

#### A-1. Playwright 설치 및 세션 매니저 (완료)
- [x] Playwright 설치 및 프로젝트 설정
- [x] 세션 매니저 공통 모듈 (쿠키 저장/로드/만료 체크)
- [x] 수동 로그인 브라우저 띄우기 API (/api/auth/browser-login)
- [x] 로그인 완료 감지 → 쿠키 자동 저장
- [x] 세션 유효성 체크 API (/api/auth/session-check)

#### A-2. 네이버 블로그 자동 발행 (dry run 완료)
- [x] 네이버 수동 로그인 → 쿠키 저장
- [x] 블로그 ID 자동 감지 (MyBlog.naver → URL 추출)
- [x] SmartEditor ONE 제목/본문 입력 자동화 (텍스트 fallback)
- [x] 도움말 패널 등 오버레이 자동 닫기
- [x] dry run 테스트 완료 (스크린샷 검증)
- [ ] 실제 발행 테스트 (별도 계정으로 진행 예정)

#### A-3. 티스토리 자동 발행 (dry run 완료)
- [x] 카카오 수동 로그인 → 서브도메인 쿠키 포함 저장
- [x] TinyMCE HTML 모드(CodeMirror) 전환 → HTML 직접 입력
- [x] 제목/본문 입력 자동화 (HTML 서식 유지)
- [x] dry run 테스트 완료 (스크린샷 검증)
- [ ] 실제 발행 테스트 (별도 계정으로 진행 예정)

#### A-4. 기존 발행 로직 점검/수정 (완료)
- [x] /api/publish에 네이버/티스토리 발행 분기 추가
- [x] /api/platforms/test에 네이버/티스토리 세션 체크 + 연결 테스트 구현
- [x] 글쓰기 UI에서 네이버/티스토리 세션 있으면 플랫폼 목록에 표시
- [x] 에러 처리 및 응답 형식 정리

#### A-5. 발행 함수 시그니처 통일 (완료)
- [x] 공통 publish(platform, title, content) 함수 (platforms/publish.ts)
- [x] 공통 testConnection(platform) 함수 (platforms/test-connection.ts)
- [x] /api/publish, /api/platforms/test에서 공통 함수 사용으로 교체

#### A-6. 사이트 설정 UI 개선 (완료)
- [x] 네이버/티스토리 "브라우저 로그인" 버튼 추가
- [x] 세션 상태 표시 (🟢 로그인됨 / ⚪ 로그인 필요)
- [x] 네이버/티스토리 폼 필드 정리 (불필요한 아이디/비밀번호 제거)
- [x] 안내 메시지 현행화 ("데스크톱 앱" → "Playwright 브라우저 자동화")

### Phase B - 글 관리 기반 (완료)
> 글 저장/관리 CRUD + 발행 이력 조회 + 설정 저장.
> 페이지 구조 변경: /posts(목록), /posts/new(새 글), /posts/[id](상세/편집)

#### B-1. 글 저장 (초안 CRUD) (완료)
- [x] 글 CRUD API (POST/GET/PUT/DELETE /api/posts, /api/posts/[id])
- [x] 글 목록 페이지 /posts (상태 배지, 검색/필터, 페이지네이션, 삭제)
- [x] 글 상세/편집 페이지 /posts/[id] (제목/키워드/본문 편집, 미리보기/편집 탭 전환, 재발행)
- [x] 기존 /posts → /posts/new로 이동 (새 글 쓰기)
- [x] AI 생성 시 자동 DRAFT 저장 (유실 방지)
- [x] 발행 시 기존 Post 업데이트 (postId 전달)

#### B-2. 발행 이력 조회 (완료)
- [x] 글 상세 페이지에 PublishLog 표시 (플랫폼, 시간, 성공/실패, URL, 에러)
- [x] 글 목록에 발행 플랫폼 색상 점 표시

#### B-3. 글 생성 UI 개선 (완료)
- [x] 발행 후 "글 목록 보기" / "새 글 작성" 버튼
- [x] 글 상세에서 키워드 수정 가능
- [x] @tailwindcss/typography 적용 (HTML 미리보기 스타일링)

#### B-4. 설정 저장 (완료)
- [x] Setting 모델에 설정값 저장/조회 API (/api/settings GET/PUT)
- [x] 글쓰기 AI 설정 — API Key, 모델, 프롬프트 DB 저장/로드
- [x] 글쓰기 설정 — 포스트 개수, 글자수, 대기시간, 발행설정 DB 저장/로드
- [x] 새 글 쓰기에서 DB 프롬프트/글자수 불러오기

### 멀티 AI 제공자 지원 (완료)
> Claude / OpenAI / Gemini 3개 AI 제공자 지원. 설정 페이지에서 탭으로 전환, 글 생성 시 선택 가능.

- [x] AI 설정 페이지 탭 UI (클로드/오픈AI/제미나이)
- [x] 제공자별 API Key, 모델 선택, 기본 AI 설정 DB 저장
- [x] OpenAI 글 생성 모듈 (lib/ai/openai.ts)
- [x] Gemini 글 생성 모듈 (lib/ai/gemini.ts)
- [x] 공통 AI 분기 모듈 (lib/ai/index.ts)
- [x] 글 생성 API provider 분기 (/api/posts/generate)
- [x] 연결 테스트 API (/api/ai/test)
- [x] 새 글 쓰기에서 AI 제공자 선택 드롭다운
- [x] 프롬프트 관리 UI 개선 (테이블 목록, 타입 분류, 행 선택→편집, 확대 편집 모달)
- [x] 시스템 프롬프트 필드 추가 (AI 역할 설정 — Claude system / OpenAI system role / Gemini systemInstruction)
- [x] 이미지 AI 설정 페이지 리뉴얼 (8개 소스, 아코디언 UI, 카테고리 분류, 연결 테스트)
- [x] Pixabay/Unsplash 이미지 검색 모듈 + API 엔드포인트
- [x] 글 생성 시 이미지 자동 삽입 (키워드 검색 → 소제목 사이에 균등 배치)
- [x] 글쓰기 페이지에서 이미지 소스 직접 선택 (설정 페이지는 API Key 관리 전용)
- [x] Pixabay 연결 테스트 per_page 최소값 수정 (400 에러 해결)
- [x] DALL-E 이미지 생성 모듈 (OpenAI API Key 자동 재활용)
- [x] Gemini Imagen 이미지 생성 모듈 (Gemini API Key 자동 재활용)
- [x] 이미지 소스 상태 배지 (연동됨/키 미등록/준비 중) + 미구현 소스 흐리게 표시
- [x] OpenAI 글 생성 시 마크다운 코드블록 자동 제거 (화면 깨짐 방지)
- [x] Pixabay per_page 최소값 3 적용 (400 에러 방지)
- [x] Unsplash 한국어 키워드 영어 자동 번역 후 재검색 (Google Translate 무료 API)
- [x] 새 글 쓰기 미리보기/HTML편집/마크다운편집 3탭 전환 (turndown + marked)
- [x] 본문 기반 글 생성 모드 (참고 글 구조 분석 → 새 주제로 리라이팅)
- [x] 참고 글 확대 편집 모달 + 글자수 카운트
- [x] 본문 기반 모드에서 추가 지시 프롬프트 선택 (선택사항)

### Phase C - 예약 발행 + 이미지
> 예약/반복 발행 스케줄러 + AI 이미지 자동 삽입.

#### C-1. 예약 발행
- [ ] 날짜/시간 지정 예약 발행
- [ ] Cron으로 예약 글 자동 발행 체크
- [ ] 예약 대기 목록 UI

#### C-2. 반복 발행 스케줄
- [ ] 매일/매주/매월 반복 설정
- [ ] 스케줄 관리 UI

#### C-3. 다중 플랫폼 동시 발행
- [ ] 여러 플랫폼 선택 → 한 번에 발행
- [ ] 플랫폼별 결과 개별 표시

#### C-4. 발행 실패 재시도
- [ ] 실패 로그에서 재시도 버튼
- [ ] 자동 재시도 정책 (선택)

#### C-5. AI 이미지 삽입 (일부 완료)
- [x] 이미지 AI 설정 페이지 (8개 소스: Pixabay/Unsplash/DuckDuckGo/Google/DALL-E/Gemini/Ideogram/로컬)
- [x] Pixabay/Unsplash 이미지 검색 모듈 + 연결 테스트 API
- [x] 글 생성 시 키워드 검색 → 본문 소제목 사이에 이미지 자동 삽입
- [x] DALL-E AI 이미지 생성 모듈 (OpenAI 키 재활용)
- [x] Gemini Imagen AI 이미지 생성 모듈 (Gemini 키 재활용)
- [ ] DuckDuckGo/Google 이미지 검색 모듈
- [ ] Ideogram AI 이미지 생성 모듈
- [ ] 썸네일 자동 생성

#### C-6. 프롬프트 고도화
- [ ] 글 구조/톤/SEO 최적화 프롬프트 개선
- [ ] 프롬프트 템플릿 다양화 (리뷰, 정보성, 리스트형 등)

### Phase D - 키워드 + 대시보드
> 키워드 리서치 + 대시보드 통계 시각화.

#### D-1. 대시보드 통계
- [ ] 발행 현황 KPI (총 발행수, 성공률, 플랫폼별 통계)
- [ ] 일별/주별 발행 추이 차트
- [ ] 최근 발행 목록 + 예약 대기 목록

#### D-2. 키워드 리서치 (일부 완료)
- [x] Google/네이버 자동완성 연관 키워드 검색 (API Key 불필요)
- [x] 키워드 검색+분석 통합 페이지 (/keywords/analysis) — 연관 키워드 검색 + 내 키워드 관리
- [x] 키워드 CRUD API (/api/keywords) — 추가/목록/삭제, 중복 체크
- [x] 사이드바 키워드분석 단독 메뉴로 변경
- [x] 네이버 검색광고 API 연동 (PC/모바일/합계 검색량 + 경쟁도 + 추천도)
- [x] 연관키워드 검색량 분석 탭 (자동완성/검색량분석 탭 전환, 정렬 가능)
- [x] 검색량 분석에서 [추가] 시 검색량 데이터 함께 저장 (재조회 불필요)
- [x] 내 키워드 테이블 상단 배치 + 연관 키워드 검색 하단 배치
- [ ] 키워드 경쟁도 분석 + 트렌드 차트 (Google Trends)
- [ ] 키워드 저장/관리 (키워드 분석 페이지)

### Phase E - 인증 + 배포
> NextAuth 인증 + Vercel 배포 + 보안/최적화.

- [ ] NextAuth.js 인증 (로그인/회원가입) + API 인증 미들웨어
- [ ] Vercel 배포 + Cron Jobs (예약 발행 체크)
- [ ] 비밀번호/인증정보 AES 암호화 저장
- [ ] PWA 최적화 (오프라인 캐싱, 푸시 알림)
- [ ] 성능 최적화 (TanStack Query, lazy load)
- [ ] 에러 핸들링 + Sentry 연동

### Phase F - 데스크톱 + SaaS
> Tauri 데스크톱 앱 + SaaS 서비스화.

#### F-1. 데스크톱 앱 (Tauri)
- [ ] Tauri 2 프로젝트 설정 + .exe 빌드
- [ ] 트레이 아이콘 + 시스템 알림 + 자동 업데이트
- [ ] 로그인 정보 로컬 암호화 저장

#### F-2. SaaS 서비스화
- [ ] 회원 시스템 (이메일/비밀번호 + SNS 로그인)
- [ ] 결제 연동 (토스페이먼츠 or Stripe — 월 구독 모델)
- [ ] 플랜 분리 (Free / Pro / Team)
- [ ] 랜딩 페이지 + 이용약관 + 어드민 대시보드

### 향후 확장
- [ ] 글 템플릿 라이브러리 (카테고리별 사전 정의 템플릿)
- [ ] SEO 분석 (제목/메타/키워드 밀도 점검)
- [ ] A/B 테스트 (제목/썸네일 변형 테스트)
- [ ] 팀 협업 (다중 사용자 + 역할 분리)
- [ ] 외부 RSS 수집 → 리라이팅 자동화

---

## 수익 모델 (SaaS 전환 시)

| 플랜 | 가격 | 내용 |
|------|------|------|
| **Free** | 무료 | 플랫폼 1개, 월 10글, AI 생성 5회 |
| **Pro** | 월 9,900원 | 플랫폼 4개, 무제한 발행, AI 무제한, 키워드 분석 |
| **Team** | 월 29,900원 | Pro + 팀원 5명 + 예약 발행 + 우선 지원 |

### AI 글 생성 비용

| AI 제공자 | 1,000자 기준 | 비고 |
|-----------|-------------|------|
| **Claude** (Sonnet) | ~$0.01 (약 15원) | 한국어 품질 우수 |
| **OpenAI** (GPT-4o) | ~$0.01 (약 15원) | 다양한 스타일 |
| **Gemini** (2.5 Flash) | ~$0.005 (약 7원) | 가장 저렴 |

> 글 100개 생성해도 $1~3 수준. Pro 플랜 구독료로 충분히 커버 가능.

---

## License

MIT License
