# BlogPilot - Multi-Platform Blog Automation System

> AI 기반 다중 플랫폼 블로그 자동화 시스템

---

## 프로젝트 개요

네이버 블로그, 티스토리, 워드프레스, 블로그스팟 4개 플랫폼에 AI로 생성한 콘텐츠를 자동 발행하는 시스템입니다.

### 핵심 기능

- **AI 글 생성**: 멀티 AI (Claude / OpenAI / Gemini) + 키워드 기반 / 본문 기반 2가지 모드 ✅
- **다중 플랫폼 발행**: 네이버, 티스토리, 워드프레스, 블로그스팟 ✅
- **브라우저 자동화**: Playwright 기반 네이버/티스토리 자동 발행 (로컬 전용) ✅
- **글 관리**: 초안 CRUD, 발행 이력, 미리보기/HTML/마크다운 편집 ✅
- **이미지 자동 삽입**: Pixabay/Unsplash 검색 + DALL-E/Gemini Imagen AI 생성 ✅
- **키워드 분석**: Google/네이버 자동완성 + 네이버 검색광고 API 검색량 ✅
- **프롬프트 관리**: 시스템 프롬프트, 타입 분류, 확대 편집 모달 ✅

---

## 지원 플랫폼

| 플랫폼 | 연동 방식 | 인증 | 상태 |
|--------|----------|------|------|
| **워드프레스** | REST API | Application Password | ✅ 발행 완료 |
| **블로그스팟** | Google Blogger API | Google OAuth 2.0 | ✅ 발행 완료 |
| **티스토리** | Playwright 자동화 | 카카오 로그인 (쿠키) | ✅ dry run 완료 |
| **네이버 블로그** | Playwright 자동화 | 네이버 로그인 (쿠키) | ✅ dry run 완료 |

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| **Framework** | Next.js 14 (App Router) + TypeScript |
| **Styling** | Tailwind CSS 3 + shadcn/ui (Base UI) |
| **Database** | PostgreSQL (Supabase) + Prisma 5 |
| **AI** | Claude / OpenAI / Gemini API |
| **이미지** | Pixabay / Unsplash / DALL-E / Gemini Imagen |
| **브라우저 자동화** | Playwright (네이버/티스토리, 로컬 전용) |
| **Server State** | TanStack Query 5 |
| **UI** | next-themes (다크모드) + sonner (Toast) + Pretendard 폰트 |
| **패키지 매니저** | pnpm |

---

## 로컬 실행

```bash
pnpm install
pnpm prisma migrate dev
pnpm dev
```

### 환경 변수

```env
# Database (Supabase)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# AI (설정 페이지에서 DB 저장 권장, .env는 선택)
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
GEMINI_API_KEY=...

# 블로그스팟 (Google OAuth)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## 콘텐츠 생성 플로우

```
1. AI 글 생성 (2가지 모드)
   ├→ [키워드 기반] 키워드 + 프롬프트 + 톤/글자수 + AI 선택 → HTML 글 생성
   └→ [본문 기반]  참고 글 붙여넣기 → AI가 구조 분석 → 새 주제로 새 글 생성
      └→ 추가 지시 프롬프트 (선택), 확대 모달 편집 지원

2. 발행
   ├→ 워드프레스/블로그스팟: API 호출
   └→ 네이버/티스토리: Playwright 브라우저 자동화 (로컬 전용)

3. 발행 로그 저장
   └→ Post + PublishLog DB 저장 (성공/실패 상태, URL, 에러 메시지)
```

---

## 디렉토리 구조

```
BlogPilot/
├── prisma/schema.prisma            # DB 스키마
├── cookies/                        # 브라우저 로그인 세션 (.gitignore)
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx            # 대시보드 (통계)
│   │   │   ├── posts/              # 글 목록 / 새 글 쓰기 / 상세 편집
│   │   │   ├── keywords/analysis/  # 키워드 분석 (자동완성 + 검색량)
│   │   │   └── settings/           # 사이트 / AI / 글쓰기 설정
│   │   └── api/
│   │       ├── posts/generate/     # AI 글 생성 (키워드/본문 모드)
│   │       ├── publish/            # 4개 플랫폼 발행
│   │       ├── keywords/           # 키워드 CRUD + 자동완성 + 검색량
│   │       ├── images/             # 이미지 검색/테스트
│   │       ├── platforms/          # 플랫폼 계정 CRUD + 연결 테스트
│   │       └── auth/               # Google OAuth + Playwright 로그인
│   ├── components/                 # shadcn/ui + 레이아웃 + providers
│   └── lib/
│       ├── ai/                     # Claude / OpenAI / Gemini 모��
│       ├── image/                  # Pixabay / Unsplash / DALL-E / Gemini
│       ├── platforms/              # 발행 + 연결 테스트 (공통 어댑터)
│       ├── browser/                # Playwright 자동화 (네이버/티스토리)
│       └── keyword/                # 네이버 검색광고 API
└── package.json
```

---

## 데이터 모델

```
User ──< Platform ──< PublishLog >── Post
  │                                    │
  └──< Keyword ──< KeywordStat         │
                                       │
Setting (key-value)                    │

Post: DRAFT → SCHEDULED → PUBLISHING → PUBLISHED / FAILED
Platform: NAVER | TISTORY | WORDPRESS | BLOGSPOT
Keyword: keyword + searchVolume (PC/모바일) + competition
```

---

## 구현 현황

### 완료

| 영역 | 내용 |
|------|------|
| **레이아웃** | 대시보드, 사이드바(확장/축소), 다크모드, 모바일 반응형 |
| **플랫폼 연동** | 4개 플랫폼 계정 관리 + 발행 + 연결 테스트 |
| **AI 글 생성** | 멀티 AI 3개 제공자 + 키워드/본문 2가지 모드 |
| **본문 기반 생성** | 참고 글 구조 분석 → 리라이팅 + 확대 모달 + 추가 프롬프트 |
| **글 관리** | CRUD, 목록/상세/편집, 미리보기/HTML/마크다운 3탭 |
| **발행** | 4개 플랫폼 발행 + 발행 이력 + 플랫폼별 결과 표시 |
| **이미지** | Pixabay/Unsplash 검색 + DALL-E/Gemini AI 생성 + 자동 삽입 |
| **프롬프트** | 테이블 관리 UI + 시스템 프롬프트 + 확대 편집 모달 |
| **키워드** | Google/네이버 자동완성 + 검색량(PC/모바일) + CRUD |
| **설정** | AI / 사이트 / 글쓰기 설정 DB 저장 |

### 미완료

| Phase | 내용 |
|-------|------|
| **C** | 예약 발행 (Cron), 반복 스케줄, 발행 실패 재시도 |
| **C** | DuckDuckGo/Google 이미지 검색, Ideogram AI, 썸네일 자동 생성 |
| **C** | 프롬프트 고도화 (SEO 최적화, 템플릿 다양화) |
| **D** | 대시보드 통계 (KPI, 차트), Google Trends 연동 |
| **E** | NextAuth 인증, Vercel 배포, 암호화, PWA 최적화 |
| **F** | Tauri 데스크톱 앱, SaaS 서비스화 (회원/결제/플랜) |

### 알려진 이슈

- 네이버/티스토리 실제 발행 테스트 미완료 (dry run만 검증)
- Unsplash 한국어 키워드 번역 검색 불안정

---

## 배포 환경

| 구분 | 서비스 | 상태 |
|------|--------|------|
| **Database** | Supabase (서울 리전) | ✅ 운영 중 |
| **Frontend + API** | 로컬 (localhost:3000) | Phase E에서 Vercel 배포 |
| **브라우저 자동화** | 로컬 Playwright | Vercel 불가, 로컬 전용 |

---

## License

MIT License
