# BlogPilot - Multi-Platform Blog Automation System

> AI 기반 다중 플랫폼 블로그 자동화 시스템

---

## 프로젝트 개요

네이버 블로그, 티스토리, 워드프레스, 블로그스팟 4개 플랫폼에 AI로 생성한 콘텐츠를 자동 발행하는 시스템입니다. 키워드 리서치부터 글 생성, 이미지 삽입, 예약 발행까지 블로그 운영의 전 과정을 자동화합니다.

### 핵심 기능

- **AI 글 생성**: Claude API 기반 고품질 한국어 콘텐츠 자동 생성
- **다중 플랫폼 발행**: 네이버 블로그, 티스토리, 워드프레스, 블로그스팟 동시 발행
- **이미지 자동 삽입**: AI 이미지 생성 (DALL-E) + 무료 스톡 이미지 (Unsplash)
- **예약 발행**: 날짜/시간 지정 예약 + 반복 스케줄 설정
- **키워드 리서치**: 네이버 검색량/경쟁도 분석, 추천 키워드 도출
- **모바일 지원**: PWA로 모바일에서도 관리 가능
- **데스크톱 앱**: Tauri로 .exe 설치 파일 생성 (Windows)

---

## 지원 플랫폼

| 플랫폼 | 연동 방식 | 인증 | 글 작성 |
|--------|----------|------|--------|
| **워드프레스** | API (자체 REST API) | Application Password | ✅ 작성/수정/삭제, 미디어, 카테고리 |
| **블로그스팟** | API (Google Blogger API) | Google OAuth 2.0 | ✅ 작성/수정/삭제, 라벨 |
| **티스토리** | 브라우저 자동화 (Puppeteer) | 로컬 로그인 | ❌ API 종료 → Tauri 앱에서 자동화 |
| **네이버 블로그** | 브라우저 자동화 (Puppeteer) | 로컬 로그인 | ❌ API 미지원 → Tauri 앱에서 자동화 |

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
| **Auth** | NextAuth.js 4 | OAuth 2.0 + JWT 세션 |
| **AI 글 생성** | Claude API (Anthropic) | 한국어 콘텐츠 생성 |
| **AI 이미지** | DALL-E API (OpenAI) | AI 이미지 생성 |
| **스톡 이미지** | Unsplash API | 무료 고품질 이미지 |
| **Server State** | TanStack Query 5 | API 데이터 캐싱, 자동 갱신 |
| **Toast** | sonner | 알림 토스트 UI |
| **Theme** | next-themes | 다크모드/라이트모드/시스템 |
| **Mobile** | PWA (next-pwa) | 모바일 앱처럼 설치 가능 |
| **Desktop** | Tauri 2 | .exe 데스크톱 앱 (경량 ~5MB) |
| **Charts** | Recharts 3 | 키워드 분석 차트 |

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

# App
NEXT_PUBLIC_APP_NAME=BlogPilot
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...                # openssl rand -base64 32

# AI - 글 생성
ANTHROPIC_API_KEY=...              # Claude API

# AI - 이미지 생성
OPENAI_API_KEY=...                 # DALL-E API

# 이미지 - 스톡
UNSPLASH_ACCESS_KEY=...            # Unsplash API

# 네이버 블로그
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...

# 티스토리
TISTORY_APP_ID=...
TISTORY_SECRET_KEY=...

# 워드프레스 (사이트별 설정 — DB에서 관리)
# WORDPRESS_SITE_URL, APPLICATION_PASSWORD 등은 UI에서 등록

# 블로그스팟 (Google)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
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
│  │  │ (Claude) │ │ (Cron)   │ │  (네이버 검색)    │  │   │
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

### 콘텐츠 생성 플로우

```
1. 키워드 리서치
   └→ 네이버 검색 API → 검색량/경쟁도 분석 → 추천 키워드 선정

2. AI 글 생성
   └→ 키워드 + 글 설정 (톤, 길이, 형식) → Claude API → 초안 생성 → 편집/확인

3. 이미지 처리
   └→ AI 생성 (DALL-E) 또는 Unsplash 검색 → 자동 삽입

4. 발행
   └→ 즉시 발행 or 예약 발행 → 플랫폼별 API 호출 → 결과 저장

5. 모니터링
   └→ 발행 이력 조회, 성공/실패 확인, 통계 대시보드
```

### 디렉토리 구조 (예정)

```
BlogPilot/
├── public/                         # 정적 파일 + PWA 매니페스트
├── prisma/
│   └── schema.prisma               # DB 스키마
├── src/
│   ├── app/
│   │   ├── (dashboard)/            # 대시보드 레이아웃 그룹
│   │   │   ├── page.tsx            # 메인 대시보드 (발행 현황, 통계)
│   │   │   ├── posts/              # 글 관리 (생성, 목록, 편집)
│   │   │   ├── schedule/           # 예약 발행 관리
│   │   │   ├── keywords/           # 키워드 리서치
│   │   │   ├── platforms/          # 플랫폼 연동 관리
│   │   │   └── settings/           # 설정 (프로필, AI, 플랫폼 계정)
│   │   ├── api/
│   │   │   ├── auth/               # 인증 (NextAuth)
│   │   │   ├── posts/              # 글 CRUD + AI 생성
│   │   │   ├── publish/            # 플랫폼별 발행
│   │   │   ├── schedule/           # 예약 발행 스케줄러
│   │   │   ├── keywords/           # 키워드 리서치 API
│   │   │   ├── images/             # 이미지 생성/검색
│   │   │   └── platforms/          # 플랫폼 계정 관리
│   │   ├── login/
│   │   └── register/
│   ├── components/
│   │   ├── ui/                     # shadcn/ui 컴포넌트
│   │   ├── layout/                 # 사이드바, 헤더
│   │   ├── editor/                 # 글 편집기 (마크다운/WYSIWYG)
│   │   └── common/                 # 공통 컴포넌트
│   └── lib/
│       ├── prisma.ts
│       ├── auth.ts                 # NextAuth 설정
│       ├── ai/
│       │   ├── claude.ts           # Claude API 클라이언트
│       │   └── dalle.ts            # DALL-E API 클라이언트
│       ├── platforms/              # 플랫폼별 어댑터
│       │   ├── naver.ts            # 네이버 블로그 API
│       │   ├── tistory.ts          # 티스토리 API
│       │   ├── wordpress.ts        # 워드프레스 API
│       │   └── blogspot.ts         # 블로그스팟 API
│       ├── keywords/
│       │   └── research.ts         # 키워드 분석 로직
│       └── services/
│           ├── post-generator.ts   # AI 글 생성 서비스
│           ├── image-service.ts    # 이미지 처리 서비스
│           └── scheduler.ts        # 예약 발행 스케줄러
├── .env.example
├── package.json
└── README.md
```

### 데이터 모델 (예정)

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

| 구분 | 서비스 | 설명 |
|------|--------|------|
| **Frontend + API** | Vercel | Next.js 서버리스 배포 |
| **Database** | Supabase | 매니지드 PostgreSQL |
| **예약 발행** | Vercel Cron Jobs | 매 분/시간 예약 글 체크 + 발행 |
| **도메인** | 추후 설정 | 커스텀 도메인 연결 |

```
GitHub Push → Vercel Auto Deploy (main branch → Production)
```

### 멀티 플랫폼 배포

```
하나의 Next.js 코드베이스로 3가지 환경 커버:

웹       → Vercel 배포 (브라우저 접속)
모바일   → PWA (홈 화면에 추가 → 네이티브 앱처럼 사용)
데스크톱 → Tauri (.exe 설치 파일 → Windows 앱)
```

| 환경 | 방식 | 특징 |
|------|------|------|
| **웹** | Vercel 배포 | URL 접속, 설치 불필요 |
| **모바일** | PWA | 홈 화면 추가, 오프라인 지원, 푸시 알림 |
| **데스크톱** | Tauri (.exe) | 경량 설치 (~5MB), 트레이 아이콘, 시스템 알림, 자동 업데이트 |

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

### Phase 1 - 프로젝트 초기 설정 + 레이아웃 (완료)
- [x] Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui 프로젝트 설정
- [x] Prisma 5 + Supabase PostgreSQL 연동 (서울 리전)
- [x] 초기 DB 스키마 (User, Platform, Post, PublishLog, Keyword, KeywordStat, Setting)
- [x] 대시보드 레이아웃 (사이드바 확장/축소 + 헤더 + 다크모드)
- [x] 모바일 반응형 (사이드바 → 햄버거 메뉴)
- [x] PWA 설정 (next-pwa, manifest, service worker)
- [x] 빈 상태 페이지 6개 (대시보드, 글 관리, 예약 발행, 키워드, 플랫폼, 설정)
- [x] 공통 유틸 (ThemeProvider, QueryProvider, ProgressBar, sonner Toast)
- [x] Pretendard 폰트 + Blue primary 디자인 시스템

### Phase 2 - 플랫폼 연동 (API 방식 — 워드프레스 우선)
> 워드프레스(자체 REST API)와 블로그스팟(Google Blogger API)만 공식 API 지원.
> 티스토리(API 종료)와 네이버 블로그(API 미지원)는 Phase 9에서 브라우저 자동화로 구현.

- [ ] 플랫폼별 어댑터 패턴 구현 (공통 인터페이스: connect, publish, edit, delete)
- [ ] 플랫폼 계정 관리 API + UI (등록/수정/삭제/연동 상태)
- [ ] 워드프레스 REST API 연동 (Application Password + 글 발행 + 미디어) — 가장 먼저
- [ ] 워드프레스 글 발행 테스트 UI (제목/본문 입력 → 발행 → 블로그에서 확인)
- [ ] 블로그스팟 API 연동 (Google OAuth + 글 발행 + 라벨)

### Phase 3 - AI 글 생성
- [ ] Claude API 연동 (글 생성 서비스)
- [ ] 글 생성 설정 UI (키워드, 톤, 길이, 형식, 타겟 독자)
- [ ] 글 생성 프롬프트 템플릿 관리
- [ ] 생성된 글 미리보기 + 편집기 (마크다운/WYSIWYG)
- [ ] 글 저장 (초안 관리)

### Phase 4 - 이미지 처리
- [ ] DALL-E API 연동 (AI 이미지 생성)
- [ ] Unsplash API 연동 (스톡 이미지 검색)
- [ ] 이미지 자동 삽입 (글 내용 기반 관련 이미지 매칭)
- [ ] 이미지 갤러리 (생성/검색한 이미지 관리)
- [ ] 썸네일 자동 생성

### Phase 5 - 발행 관리
- [ ] 즉시 발행 (단일/다중 플랫폼 동시 발행)
- [ ] 예약 발행 (날짜/시간 지정)
- [ ] 반복 발행 스케줄 (매일/매주/매월)
- [ ] 발행 이력 조회 (성공/실패 상태, 발행 URL)
- [ ] 발행 실패 시 재시도

### Phase 6 - 키워드 리서치
- [ ] 네이버 검색 API 연동 (키워드 검색량 분석)
- [ ] 키워드 추천 (관련 키워드, 연관 검색어)
- [ ] 키워드 경쟁도 분석
- [ ] 키워드 트렌드 차트
- [ ] 키워드 저장/관리

### Phase 7 - 대시보드 + 통계
- [ ] 발행 현황 KPI (총 발행수, 성공률, 플랫폼별 통계)
- [ ] 일별/주별 발행 추이 차트
- [ ] 플랫폼별 발행 비교
- [ ] 최근 발행 목록
- [ ] 예약 대기 목록

### Phase 8 - 인증 + 배포 + 최적화
- [ ] NextAuth.js 인증 (로그인/회원가입)
- [ ] 역할 기반 접근 제어 (필요 시)
- [ ] API 인증 미들웨어
- [ ] Vercel 배포
- [ ] Vercel Cron Jobs 설정 (예약 발행 체크)
- [ ] PWA 최적화 (오프라인 캐싱, 푸시 알림)
- [ ] 성능 최적화 (TanStack Query, lazy load)
- [ ] 에러 핸들링 + Sentry 연동

### Phase 9 - 데스크톱 앱 (Tauri) + 네이버 블로그 자동화
> 네이버 블로그는 글 작성 API를 제공하지 않으므로, Tauri 데스크톱 앱에서
> 브라우저 자동화(Puppeteer)로 구현. 사용자 PC에서 로컬 실행하므로 보안 안전.

- [ ] Tauri 2 프로젝트 설정 (Next.js 연동)
- [ ] .exe 빌드 설정 (Windows 설치 파일)
- [ ] 트레이 아이콘 + 시스템 알림
- [ ] 자동 업데이트 (Tauri Updater)
- [ ] 시작 시 자동 실행 옵션
- [ ] 티스토리 브라우저 자동화 (Puppeteer — 로그인 → 글쓰기 → 발행) — API 종료로 자동화 필요
- [ ] 네이버 블로그 브라우저 자동화 (Puppeteer — 로그인 → 글쓰기 → 발행) — API 미지원
- [ ] 로그인 정보 로컬 암호화 저장 (서버 전송 안 함)

### Phase 10 - SaaS 서비스화
> 다중 사용자 서비스로 전환. 각 사용자가 자기 블로그 계정을 OAuth로 연동하여 사용.
> 티스토리 API 앱은 BlogPilot 1개만 등록, 사용자별 토큰으로 각자의 블로그에 발행.

- [ ] 회원 시스템 (NextAuth.js — 이메일/비밀번호 + SNS 로그인)
- [ ] 결제 연동 (토스페이먼츠 or Stripe — 월 구독 모델)
- [ ] 플랜 분리 (Free: 플랫폼 1개, 월 10글, AI 5회 / Pro: 전체 무제한 / Team: 팀원 5명)
- [ ] 사용량 제한 (플랜별 AI 글 생성 횟수, 발행 횟수 체크)
- [ ] 랜딩 페이지 (서비스 소개, 요금제, 가입 유도)
- [ ] 이용약관 / 개인정보처리방침
- [ ] 어드민 대시보드 (전체 사용자 현황, 매출, 구독 관리)

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

### AI 글 생성 비용 (Claude API)

| 글 길이 | 비용 |
|---------|------|
| 1,000자 | ~$0.01 (약 15원) |
| 2,000자 | ~$0.02 (약 30원) |
| 3,000자 | ~$0.03 (약 45원) |

> 글 100개 생성해도 $2~3 수준. Pro 플랜 구독료로 충분히 커버 가능.

---

## License

MIT License
