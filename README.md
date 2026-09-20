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
│   ├── App.jsx            # 앱 전체 (화면·상태·저장)
│   └── styles.css         # 디자인 토큰 + 상태/반응형 레이어
├── public/                # 로고·파비콘·OG 이미지
├── supabase/
│   └── core-state-schema.sql   # 경험/스킬/지원현황 등 전체 데이터 저장용
└── api/
    ├── extract.js            # 파일 가져오기(경험 추출)
    ├── chat.js                # 자소서·면접·경험 진단 챗봇
    ├── extract-jd.js          # 채용공고 요구 역량 추출
    └── health.js              # AI 키 등록 여부 확인 (진단용)
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

   로그인·클라우드 저장까지 쓰려면 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 도 함께 등록해야 합니다 — 아래 "로그인 & 클라우드 저장 설정" 섹션 참고.
4. Deploy. 완료되면 `https://프로젝트명.vercel.app` 주소가 발급됩니다.

`api/extract.js`는 Vercel의 서버리스 함수 규칙(`api/` 폴더 = 자동으로 `/api/*` 엔드포인트)을 그대로 사용하므로 별도 설정이 필요 없습니다.

### Netlify를 쓸 경우

Netlify는 서버리스 함수 위치가 다릅니다 (`netlify/functions/`). 이 경우:
1. `api/extract.js`를 `netlify/functions/extract.js`로 이동
2. 함수 시그니처를 Netlify 방식(`exports.handler = async (event) => {...}`)으로 수정
3. `src/App.jsx`의 `fetch("/api/extract")`를 `fetch("/.netlify/functions/extract")`로 수정
4. Netlify 대시보드 **Site settings → Environment variables**에 `ANTHROPIC_API_KEY` 등록

## 로그인 & 클라우드 저장 설정 (Supabase + Google)

**모든 Career OS 데이터(경험/스킬/자격증/수상기록/지원 현황/마스터 자소서·면접/휴지통)가 Supabase에 저장됩니다.** localStorage는 "즉시 반응 + 오프라인 캐시" 용도로 함께 쓰이고, 로그인되어 있으면 Supabase가 진짜 저장소입니다.

로그인은 **Google 계정 한 가지**입니다 (이메일/비밀번호 없음). 로그인하지 않아도 모든 기능이 localStorage만으로 정상 동작합니다 — 이건 오류가 아니라 정상적인 "로컬 전용" 모드입니다.

### 1단계 — Supabase 프로젝트 & 스키마

1. [supabase.com](https://supabase.com) 계정 생성 → **New Project**
2. **SQL Editor → New query** → 이 저장소의 `supabase/core-state-schema.sql` 전체를 붙여넣고 **Run**
   (`create table if not exists` 로 작성되어 있어 여러 번 실행해도 안전합니다)
3. **Table Editor** 에 `career_os_state` 가 보이면 성공 (PK `(user_id, key)`, RLS 활성)
4. **Project Settings → API** 에서 두 값을 복사:
   - `Project URL`
   - `anon` `public` 키 — ⚠️ `service_role` 키가 아닙니다. 그건 클라이언트에 노출되면 RLS가 무력화됩니다.

### 2단계 — Google OAuth 클라이언트 만들기

1. Supabase → **Authentication → Sign In / Providers → Google** 패널에 표시된 **Callback URL** 을 복사합니다.
   형식: `https://<project-ref>.supabase.co/auth/v1/callback`
2. [console.cloud.google.com](https://console.cloud.google.com) → 프로젝트 생성 또는 선택
3. **APIs & Services → OAuth consent screen**
   - User Type: **External**
   - 앱 이름 / 사용자 지원 이메일 / 개발자 연락처 입력
   - Scopes 는 기본값(`email`, `profile`, `openid`) 그대로 — 추가할 것 없음
   - Publishing status 가 **Testing** 이면 로그인할 구글 계정을 **Test users** 에 추가해야 합니다. 본인 외 사용자도 쓸 거면 **Publish app**.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized redirect URIs**: 1번에서 복사한 Supabase Callback URL **하나만** 넣습니다.
     브라우저가 Supabase 도메인을 거쳐 되돌아오는 구조라, 앱 주소나 localhost 를 여기 넣을 필요가 없습니다.
   - Authorized JavaScript origins 는 비워둬도 됩니다.
5. 발급된 **Client ID** 와 **Client Secret** 을 Supabase → **Authentication → Sign In / Providers → Google** 에 붙여넣고, **Enable** 토글을 켠 뒤 **Save**

### 3단계 — 리다이렉트 주소 허용목록

Supabase → **Authentication → URL Configuration**

- **Site URL**: `https://<내-프로젝트>.vercel.app`
- **Redirect URLs** 에 아래를 모두 추가:
  - `https://<내-프로젝트>.vercel.app/**`
  - `http://localhost:5173/**` (`npm run dev`)
  - `http://localhost:3000/**` (`vercel dev`)

랜딩(`/`)과 앱 화면(`/app`) 양쪽에서 로그인할 수 있어 돌아오는 경로가 두 가지입니다. `/**` 와일드카드가 둘 다 덮습니다.

### 4단계 — 환경변수

**로컬**: `cp .env.example .env` 후 두 값을 채웁니다.

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

비워두면 로그인 버튼이 동작하지 않고 로컬 전용 모드로 돌아갑니다 (오류 아님).

**Vercel**: Settings → Environment Variables 에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 를 추가하고 **Production / Preview / Development 를 모두 체크**합니다.

> ⚠️ **추가만 하고 끝내면 안 됩니다. 반드시 Redeploy 하세요.**
> Vite 는 `import.meta.env.VITE_*` 를 **빌드 시점에 문자열로 번들에 박아넣습니다.** 이미 배포된 번들에는 여전히 `undefined` 가 들어 있어서, 재배포하지 않으면 환경변수를 아무리 정확히 넣어도 화면에 아무 변화가 없습니다. 가장 흔한 실수입니다.

### 동작 확인

- 헤더 우측 버튼이 **"Google로 로그인"** → 클릭 → 구글 동의 → 돌아오면 **내 이메일 + 로그아웃** 으로 바뀝니다.
- 헤더의 상태 점이 **"클라우드에 저장됨"**(녹색)으로 바뀝니다. 그 밖의 표시: 동기화 중… / 동기화 실패(로컬엔 저장됨) / 저장됨 · 이 브라우저에만(미로그인 또는 Supabase 미설정).
- Supabase → **Table Editor → career_os_state** 에 행이 생기고, **Authentication → Users** 에 계정이 보입니다.
- 다른 브라우저에서 같은 구글 계정으로 로그인하면 같은 데이터가 보입니다.

### 로그인 시 데이터 충돌

로그인 전 이 브라우저에 데이터가 있었고 클라우드에도 다른 데이터가 있으면, **어느 쪽을 쓸지 묻는 창**이 뜹니다. 말없이 덮어쓰지 않습니다. 한쪽에만 데이터가 있으면 묻지 않고 그대로 이어붙입니다.

## 연결이 안 되거나 자주 끊길 때

연결이 실패해도 데이터는 localStorage 에 계속 저장되므로 유실되지 않습니다.
서버에 AI 키가 등록돼 있는지는 `/api/health` 로 직접 확인할 수 있습니다.

| 증상 | 확인할 것 |
|---|---|
| "Google로 로그인" 을 눌러도 아무 일도 안 일어남 | `.env` 의 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 가 비어 있는지 (비어 있으면 로컬 전용 모드) |
| 구글 화면까지 갔다 왔는데 여전히 로그아웃 상태 | Supabase **URL Configuration → Redirect URLs** 에 지금 접속 중인 주소가 `/**` 형태로 들어 있는지 |
| `redirect_uri_mismatch` 오류 | Google Cloud 의 **Authorized redirect URIs** 가 Supabase Callback URL 과 **글자 그대로** 같은지 |
| `Unsupported provider` / `provider is not enabled` | Supabase → Sign In / Providers → Google 의 Enable 토글이 꺼져 있음 |
| `access_denied` 로 되돌아옴 | OAuth consent screen 이 Testing 모드인데 그 구글 계정이 **Test users** 에 없음 |
| 로컬은 되는데 배포 사이트만 안 됨 | Vercel 환경변수 추가 후 **Redeploy** 했는지 (위 4단계 경고) |


## AI 제공사 폴백 (선택 기능)

`api/extract.js`, `api/chat.js`는 아래 순서로 시도하고, 실패하면(토큰 소진, 요청량 초과, 일시적 오류 등) 자동으로 다음 제공사로 넘어갑니다.

1. **Anthropic (Claude)** — `ANTHROPIC_API_KEY` 있을 때, 품질 최우선
2. **OpenAI (GPT, `gpt-4o-mini`)** — `OPENAI_API_KEY` 있을 때
3. **Google Gemini (`gemini-3.5-flash-lite`)** — `GEMINI_API_KEY` 있을 때, **무료**

세 개 다 실패하면 마지막 오류 메시지를 그대로 화면에 보여줍니다. 어떤 제공사가 응답했는지는 화면에 표시하지 않고 조용히 전환됩니다.

**무료로만 쓰고 싶다면**: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`는 아예 등록하지 말고 `GEMINI_API_KEY`만 등록하세요. 그러면 Gemini만 사용됩니다.

- 발급: [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — 카드 등록 없이 구글 계정만으로 즉시 발급
- 무료 등급 기준 하루 1,500회 정도로 넉넉함
- 단, 무료 등급은 **입력·출력 데이터가 구글의 모델 학습에 활용될 수 있다는 약관**이 있습니다. 이력서에 이름·이메일 등 개인정보가 들어가는 것이 신경 쓰인다면, 유료 등급(Vertex AI 경유)으로 전환하거나 민감 정보는 빼고 테스트하는 것을 권장합니다.

## 중요 — 배포 전 반드시 확인할 것

1. **API 키 노출 금지**: `src/App.jsx`에서 절대로 `https://api.anthropic.com`을 직접 호출하지 마세요. 반드시 `api/extract.js`(서버)를 거쳐야 키가 안전합니다. 이미 이 구조로 되어 있습니다.
2. **`.env`는 커밋하지 않기**: `.gitignore`에 포함되어 있지만, 실수로 키를 코드에 하드코딩하지 않았는지 배포 전 한 번 더 확인하세요.
3. **데이터 저장 방식**:
   - `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`를 설정하고 **Google 로그인까지 하면**, **경험/스킬/자격증/수상기록/지원 현황/마스터 자소서·면접/휴지통 데이터 전부** Supabase(클라우드)에 저장됩니다. 이 브라우저의 localStorage는 즉시 반응을 위한 캐시로 함께 쓰이지만, 진짜 저장소는 Supabase입니다. 자세한 설정은 위 "클라우드 저장 설정" 섹션 참고.
   - Supabase를 설정하지 않으면 예전처럼 이 브라우저의 localStorage에만 저장됩니다 (기기·브라우저 간 동기화 안 됨). 사이드바 하단의 "데이터 백업(다운로드)"으로 주기적으로 JSON 백업을 받아두는 걸 권장합니다.
4. **`.docx`/`.xlsx`/`.xls`/`.csv` 파싱**은 각각 `mammoth`, `xlsx`(SheetJS) 패키지로 처리됩니다. `npm install` 시 자동 설치되므로 별도 조치 불필요합니다. 엑셀 파일에 시트가 여러 개면 화면에서 시트를 선택하는 UI가 뜹니다.
5. **자소서 챗봇**은 대화 기록 전체를 매 요청마다 `/api/chat`으로 다시 보내는 방식입니다 (서버가 상태를 기억하지 않음). 대화가 길어질수록 요청 토큰이 늘어나 비용이 증가하니 참고하세요.
6. **폰트**: Spoqa Han Sans Neo를 CDN에서 불러옵니다(index.html). 사내망 등 CDN 차단 환경이면 폰트가 시스템 기본 폰트로 대체됩니다 (기능에는 영향 없음).

## Anthropic API 키 발급

1. [console.anthropic.com](https://console.anthropic.com) 가입/로그인
2. **API Keys** 메뉴에서 새 키 생성
3. 결제 수단 등록 필요 (사용량 기반 과금, Claude Sonnet 기준 파일 1건 추출당 매우 저렴한 비용)
