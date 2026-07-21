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
│   └── App.jsx            # 앱 전체 (기존 career-os-mvp.jsx)
└── api/
    ├── extract.js         # 파일 가져오기 기능의 서버리스 프록시
    └── chat.js            # 자소서 작성 챗봇의 서버리스 프록시
```

두 서버리스 함수 모두 Anthropic API 키를 서버에서만 사용하며, 브라우저는 `/api/extract`, `/api/chat`만 호출합니다.

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

## AI 제공사 폴백 (선택 기능)

`api/extract.js`, `api/chat.js`는 아래 순서로 시도하고, 실패하면(토큰 소진, 요청량 초과, 일시적 오류 등) 자동으로 다음 제공사로 넘어갑니다.

1. **Anthropic (Claude)** — `ANTHROPIC_API_KEY` 있을 때, 품질 최우선
2. **OpenAI (GPT, `gpt-4o-mini`)** — `OPENAI_API_KEY` 있을 때
3. **Google Gemini (`gemini-3.5-flash`)** — `GEMINI_API_KEY` 있을 때, **무료**

세 개 다 실패하면 마지막 오류 메시지를 그대로 화면에 보여줍니다. 어떤 제공사가 응답했는지는 화면에 표시하지 않고 조용히 전환됩니다.

**무료로만 쓰고 싶다면**: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`는 아예 등록하지 말고 `GEMINI_API_KEY`만 등록하세요. 그러면 Gemini만 사용됩니다.

- 발급: [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — 카드 등록 없이 구글 계정만으로 즉시 발급
- 무료 등급 기준 하루 1,500회 정도로 넉넉함
- 단, 무료 등급은 **입력·출력 데이터가 구글의 모델 학습에 활용될 수 있다는 약관**이 있습니다. 이력서에 이름·이메일 등 개인정보가 들어가는 것이 신경 쓰인다면, 유료 등급(Vertex AI 경유)으로 전환하거나 민감 정보는 빼고 테스트하는 것을 권장합니다.

## 중요 — 배포 전 반드시 확인할 것

1. **API 키 노출 금지**: `src/App.jsx`에서 절대로 `https://api.anthropic.com`을 직접 호출하지 마세요. 반드시 `api/extract.js`(서버)를 거쳐야 키가 안전합니다. 이미 이 구조로 되어 있습니다.
2. **`.env`는 커밋하지 않기**: `.gitignore`에 포함되어 있지만, 실수로 키를 코드에 하드코딩하지 않았는지 배포 전 한 번 더 확인하세요.
3. **데이터는 새로고침 시 초기화됩니다**: 현재 모든 데이터(경험, 스킬, 지원 현황 등)는 브라우저 메모리(React state)에만 있고, 새로고침하면 시드 데이터로 되돌아갑니다. 실제 서비스로 쓰려면 다음 중 하나가 필요합니다.
   - 가장 간단: `localStorage`에 저장 (개인용 정도로 충분, 별도 서버 불필요)
   - 정식: Supabase/Firebase 등 백엔드 DB 연결 (여러 기기 동기화, 로그인 필요 시)

   원하시면 이 중 하나를 마저 붙여드릴 수 있습니다.
4. **`.docx`/`.xlsx`/`.xls`/`.csv` 파싱**은 각각 `mammoth`, `xlsx`(SheetJS) 패키지로 처리됩니다. `npm install` 시 자동 설치되므로 별도 조치 불필요합니다. 엑셀 파일에 시트가 여러 개면 화면에서 시트를 선택하는 UI가 뜹니다.
5. **자소서 챗봇**은 대화 기록 전체를 매 요청마다 `/api/chat`으로 다시 보내는 방식입니다 (서버가 상태를 기억하지 않음). 대화가 길어질수록 요청 토큰이 늘어나 비용이 증가하니 참고하세요.
6. **폰트**: Pretendard를 CDN에서 불러옵니다(index.html). 사내망 등 CDN 차단 환경이면 폰트가 시스템 기본 폰트로 대체됩니다 (기능에는 영향 없음).

## Anthropic API 키 발급

1. [console.anthropic.com](https://console.anthropic.com) 가입/로그인
2. **API Keys** 메뉴에서 새 키 생성
3. 결제 수단 등록 필요 (사용량 기반 과금, Claude Sonnet 기준 파일 1건 추출당 매우 저렴한 비용)
