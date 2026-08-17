# Career OS — 배포 가이드

## 파일 구성

```
career-os-app/
├── index.html            # 진입 HTML
├── package.json           # 의존성 정의
├── vite.config.js         # 빌드 설정
├── .env.example           # 환경변수 예시 (실제 키는 .env에)
├── .gitignore
├── src/
│   ├── main.jsx           # React 렌더링 진입점
│   └── App.jsx            # 앱 전체 (localStorage 기반 기능 + 브랜딩 탭)
├── supabase/
│   ├── branding-schema.sql     # "퍼스널 브랜딩" 탭 전용 DB 스키마
│   └── core-state-schema.sql   # 경험/스킬/지원현황 등 나머지 전체 데이터 저장용
└── api/
    ├── extract.js            # 파일 가져오기(경험 추출)
    ├── chat.js                # 자소서·면접·경험 진단 챗봇
    ├── extract-jd.js          # 채용공고 요구 역량 추출
    ├── branding-followup.js   # 브랜딩 — 꼬리질문 생성
    ├── branding-extract.js    # 브랜딩 — 프로필 항목 추출
    ├── branding-synthesize.js # 브랜딩 — 포지셔닝·헤드라인·아키타입 생성
    └── health.js               # AI 키 등록 여부 확인 (연결 진단용)
```

서버리스 함수들은 전부 Anthropic/OpenAI/Gemini API 키를 서버에서만 사용하며, 브라우저는 `/api/*` 경로만 호출합니다.

## 로컬에서 확인하기

```bash
npm install
npm run dev
```

`http://localhost:5173` 접속. 단, `/api/extract`는 Vite 개발 서버만으로는 동작하지 않습니다 (서버리스 함수는 Vercel 환경에서 실행되는 방식). 파일 가져오기 기능까지 로컬에서 테스트하려면 Vercel CLI가 필요합니다.

```bash
npm install -g vercel
vercel dev
```

## 배포 (Vercel 기준 — 가장 간단함)

1. 이 폴더를 GitHub 저장소에 올립니다.
   ```bash
   cd career-os-app
   git init
   git add .
   git commit -m "Career OS MVP"
   git remote add origin <내 GitHub 저장소 URL>
   git push -u origin main
   ```
2. [vercel.com](https://vercel.com) 에서 GitHub 저장소를 Import 합니다. Framework Preset은 자동으로 "Vite"가 인식됩니다.
3. **Settings → Environment Variables** 에서 다음을 추가합니다.
   | Key | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` (선택) | [console.anthropic.com](https://console.anthropic.com)에서 발급받은 키 |
   | `OPENAI_API_KEY` (선택) | [platform.openai.com](https://platform.openai.com)에서 발급받은 키 |
   | `GEMINI_API_KEY` (선택, 무료) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey)에서 카드 등록 없이 발급받은 키 |

   세 개 중 **최소 하나는** 등록해야 합니다. 자세한 우선순위·폴백 방식은 아래 "AI 제공사 폴백" 섹션 참고.
4. Deploy. 완료되면 `https://프로젝트명.vercel.app` 주소가 발급됩니다.

`api/extract.js`는 Vercel의 서버리스 함수 규칙(`api/` 폴더 = 자동으로 `/api/*` 엔드포인트)을 그대로 사용하므로 별도 설정이 필요 없습니다.

### Netlify를 쓸 경우

Netlify는 서버리스 함수 위치가 다릅니다 (`netlify/functions/`). 이 경우:
1. `api/extract.js`를 `netlify/functions/extract.js`로 이동
2. 함수 시그니처를 Netlify 방식(`exports.handler = async (event) => {...}`)으로 수정
3. `src/App.jsx`의 `fetch("/api/extract")`를 `fetch("/.netlify/functions/extract")`로 수정
4. Netlify 대시보드 **Site settings → Environment variables**에 `ANTHROPIC_API_KEY` 등록

## 퍼스널 브랜딩 탭 설정 (Supabase) — 이제 전체 데이터가 여기 저장됩니다

**모든 Career OS 데이터(경험/스킬/자격증/수상기록/지원 현황/마스터 자소서·면접/휴지통 + 브랜딩 탭)가 Supabase에 저장됩니다.** 브라우저 localStorage는 이제 "즉시 반응 + 오프라인 캐시" 용도로만 함께 쓰이고, Supabase가 설정되어 있으면 그게 진짜 저장소입니다.

**설정 순서**
1. [supabase.com](https://supabase.com) 무료 계정 생성 → **New Project**
2. 프로젝트가 만들어지면 좌측 메뉴 **SQL Editor** → New query
3. 이 저장소의 SQL 파일 **2개**를 순서대로 통째로 붙여넣고 각각 **Run**:
   - `supabase/branding-schema.sql` (브랜딩 탭용 테이블 6개)
   - `supabase/core-state-schema.sql` (경험/스킬/지원현황 등 나머지 전체용 테이블 1개)
4. 좌측 메뉴 **Project Settings → API**에서 두 값을 확인:
   - `Project URL`
   - `anon` `public` key (⚠ `service_role` key 아님 — 그건 절대 클라이언트에 노출하면 안 됩니다)
5. Vercel 프로젝트 → **Settings → Environment Variables**에 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Redeploy

**로그인 화면이 없는 이유**: 개인용 도구라는 성격에 맞게, Supabase의 **익명 로그인(anonymous auth)**을 사용합니다. 브라우저에서 처음 접속하면 자동으로 익명 계정이 생성되고, 그 뒤로는 같은 브라우저에서 계속 그 계정으로 연결됩니다. 이메일/비밀번호 입력이 없습니다.

**최초 마이그레이션**: Supabase 연결 전에 이미 이 브라우저에 데이터가 있었다면, 연결 직후 그 데이터가 자동으로 Supabase에 한 번 업로드됩니다 (덮어쓰지 않고, 클라우드가 비어있을 때만). 그 이후로는 Supabase가 기준이 됩니다.

**사이드바 하단에 저장 상태가 실시간으로 표시됩니다**: 클라우드에 저장됨 / 동기화 중… / 동기화 실패(로컬엔 저장됨) / 이 브라우저에만 저장됨(Supabase 미설정 시).

**주의**: 익명 계정은 브라우저(정확히는 브라우저의 로컬 인증 토큰)에 묶여 있습니다. 브라우저 데이터를 완전히 지우면 그 계정에 다시 로그인할 방법이 없어 Supabase에 저장된 데이터에 접근할 수 없게 됩니다. 이 한계를 없애려면 나중에 "이메일 연결"(계정 업그레이드) 기능을 추가할 수 있습니다 — 필요하시면 요청해주세요.

**Supabase를 설정하지 않으면**: 예전처럼 localStorage만 사용하는 개인 브라우저 저장 방식으로 그대로 동작합니다 (브랜딩 탭만 설정 안내 화면이 뜨고, 나머지 기능은 정상 작동).

**AI 서버리스 함수 3개 추가됨(브랜딩용)**: `api/branding-followup.js`, `api/branding-extract.js`, `api/branding-synthesize.js` — 기존 AI 제공사 폴백(Anthropic→OpenAI→Gemini) 구조를 그대로 따릅니다. 별도 설정 불필요.

## 연결이 안 되거나 자주 끊길 때

브랜딩 탭 우측 상단의 **"연결 상태 확인"**을 누르면 자동으로 5가지를 점검하고, 문제가 있으면 구체적인 해결 방법까지 보여줍니다:
1. Supabase 환경변수 존재 여부
2. Supabase 클라이언트 생성 여부
3. 익명 로그인 성공 여부
4. 데이터베이스(테이블) 접근 가능 여부
5. 서버에 AI 키가 등록되어 있는지 (`/api/health`)

**"연결하는 중…"에서 안 넘어갈 때 가장 흔한 원인**: Supabase 대시보드에서 **Anonymous Sign-Ins**가 꺼져 있는 경우입니다.
→ Supabase 대시보드 → **Authentication → Sign In / Providers → Anonymous Sign-Ins** 켜기

**클라우드 연결이 안 될 때도 작업이 끊기지 않도록**: 브랜딩 워크북에서 연결에 실패하면 "오프라인으로 계속하기"를 선택할 수 있습니다. AI 꼬리질문·프로필 추출 없이 답변 작성만 가능하고, 이 브라우저에 안전하게 저장됩니다. 나중에 연결되면 화면 상단에 업로드 배너가 뜹니다.

## AI 제공사 폴백 (선택 기능)

`api/extract.js`, `api/chat.js`는 아래 순서로 시도하고, 실패하면(토큰 소진, 요청량 초과, 일시적 오류 등) 자동으로 다음 제공사로 넘어갑니다.

1. **Anthropic (Claude)** — `ANTHROPIC_API_KEY` 있을 때, 품질 최우선
2. **OpenAI (GPT, `gpt-4o-mini`)** — `OPENAI_API_KEY` 있을 때
3. **Google Gemini (`gemini-2.5-flash`)** — `GEMINI_API_KEY` 있을 때, **무료**

세 개 다 실패하면 마지막 오류 메시지를 그대로 화면에 보여줍니다. 어떤 제공사가 응답했는지는 화면에 표시하지 않고 조용히 전환됩니다.

**무료로만 쓰고 싶다면**: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`는 아예 등록하지 말고 `GEMINI_API_KEY`만 등록하세요. 그러면 Gemini만 사용됩니다.

- 발급: [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — 카드 등록 없이 구글 계정만으로 즉시 발급
- 무료 등급 기준 하루 1,500회 정도로 넉넉함
- 단, 무료 등급은 **입력·출력 데이터가 구글의 모델 학습에 활용될 수 있다는 약관**이 있습니다. 이력서에 이름·이메일 등 개인정보가 들어가는 것이 신경 쓰인다면, 유료 등급(Vertex AI 경유)으로 전환하거나 민감 정보는 빼고 테스트하는 것을 권장합니다.

## 중요 — 배포 전 반드시 확인할 것

1. **API 키 노출 금지**: `src/App.jsx`에서 절대로 `https://api.anthropic.com`을 직접 호출하지 마세요. 반드시 `api/extract.js`(서버)를 거쳐야 키가 안전합니다. 이미 이 구조로 되어 있습니다.
2. **`.env`는 커밋하지 않기**: `.gitignore`에 포함되어 있지만, 실수로 키를 코드에 하드코딩하지 않았는지 배포 전 한 번 더 확인하세요.
3. **데이터 저장 방식**:
   - `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`를 설정하면, **경험/스킬/자격증/수상기록/지원 현황/마스터 자소서·면접/휴지통/브랜딩 데이터 전부** Supabase(클라우드)에 저장됩니다. 이 브라우저의 localStorage는 즉시 반응을 위한 캐시로 함께 쓰이지만, 진짜 저장소는 Supabase입니다. 자세한 설정은 위 "퍼스널 브랜딩 탭 설정" 섹션 참고.
   - Supabase를 설정하지 않으면 예전처럼 이 브라우저의 localStorage에만 저장됩니다 (기기·브라우저 간 동기화 안 됨). 사이드바 하단의 "데이터 백업(다운로드)"으로 주기적으로 JSON 백업을 받아두는 걸 권장합니다.
4. **`.docx`/`.xlsx`/`.xls`/`.csv` 파싱**은 각각 `mammoth`, `xlsx`(SheetJS) 패키지로 처리됩니다. `npm install` 시 자동 설치되므로 별도 조치 불필요합니다. 엑셀 파일에 시트가 여러 개면 화면에서 시트를 선택하는 UI가 뜹니다.
5. **자소서 챗봇**은 대화 기록 전체를 매 요청마다 `/api/chat`으로 다시 보내는 방식입니다 (서버가 상태를 기억하지 않음). 대화가 길어질수록 요청 토큰이 늘어나 비용이 증가하니 참고하세요.
6. **폰트**: Pretendard를 CDN에서 불러옵니다(index.html). 사내망 등 CDN 차단 환경이면 폰트가 시스템 기본 폰트로 대체됩니다 (기능에는 영향 없음).

## Anthropic API 키 발급

1. [console.anthropic.com](https://console.anthropic.com) 가입/로그인
2. **API Keys** 메뉴에서 새 키 생성
3. 결제 수단 등록 필요 (사용량 기반 과금, Claude Sonnet 기준 파일 1건 추출당 매우 저렴한 비용)
