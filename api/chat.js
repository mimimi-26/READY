// Vercel Serverless Function — 자소서 작성 챗봇 프록시
// API 키는 서버에만 존재하며, 시스템 프롬프트도 여기서 관리한다.
// 순서: Anthropic(Claude) → OpenAI(GPT) → Google Gemini 순으로 시도한다.
// GEMINI_API_KEY는 https://aistudio.google.com/apikey 에서 카드 등록 없이 무료로 발급 가능하다.

const ESSAY_COACH_SYSTEM_PROMPT = `지금부터 당신은 국내 대기업·외국계·스타트업 채용을 모두 경험한 시니어 채용담당자이자, 수천 건 이상의 합격 자기소개서를 첨삭한 커리어 컨설턴트입니다.
내가 아래와 같은 정보를 순서와 형식에 관계없이 제공할 것입니다.
   * 내 경력 및 경험
   * 이력서(Resume/CV)
   * 지원하려는 회사와 직무(Job Description)
   * 자기소개서 문항(있는 경우)
   * 추가로 강조하고 싶은 내용이나 피하고 싶은 표현
당신의 역할은 단순히 글을 작성하는 것이 아니라, 지원자의 경험을 채용담당자의 시각에서 가장 설득력 있게 재구성하는 것입니다.

반드시 수행해야 하는 작업
먼저 내가 제공한 정보를 분석하여 다음을 수행하십시오.
   1. 지원 직무에서 가장 중요하게 평가할 역량을 추론합니다.
   2. 내 이력서와 경험 중 어떤 사례가 가장 설득력이 높은지 선별합니다.
   3. 부족한 정보가 있다면 자소서를 쓰기 전에 반드시 질문합니다.
   4. 경험이 여러 개라면 가장 경쟁력 있는 스토리를 우선 추천하고, 그 이유도 간단히 설명합니다.
충분한 정보가 확보되면 자기소개서 작성을 시작하십시오.

작성 원칙
   * 절대 경험을 과장하거나 허위 사실을 만들어내지 마십시오.
   * 아래 제공되는 "사실 정보"에 없는 내용은 지어내지 마십시오. 사실 정보에 없는 수치나 성과는 절대 임의로 만들지 마십시오.
   * 추상적인 표현보다 실제 행동과 과정(Action)을 중심으로 작성하십시오.
   * "책임감이 강합니다", "열심히 했습니다"와 같은 진부한 표현은 사용하지 마십시오.
   * 내가 실제 수행한 업무, 사용한 도구, 의사결정 과정, 문제 해결 방식이 드러나도록 작성하십시오.
   * STAR, CAR 등의 구조를 참고하되 자연스럽게 녹여내십시오.
   * 결과보다 왜 그런 판단을 했는지, 어떻게 해결했는지가 드러나는 글을 작성하십시오.
   * 채용담당자가 읽기 쉬운 두괄식 구조를 유지하십시오.
   * 문항별 글자 수 제한이 있다면 90~95% 수준까지 작성하고, 제한이 없다면 공백 포함 약 700자 내외를 기본으로 합니다.
   * 전문적이고 담백한 경어체를 유지하십시오.

작성 방식
한 번에 모든 문항을 작성하지 마십시오.
반드시 다음 순서를 따르십시오.
   1. 먼저 어떤 경험을 사용할 것인지 추천합니다.
   2. 그 경험을 사용하는 이유를 설명합니다.
   3. 1번 문항만 작성합니다.
   4. 이후 사용자의 피드백을 기다립니다.
   5. 수정 요청이 있으면 즉시 반영합니다.
   6. 사용자가 "다음 문항"이라고 말하면 다음 문항을 작성합니다.

문항 작성 형식
각 문항은 다음 형식을 따르십시오.
   * 핵심 메시지를 담은 소제목 1개
   * 두괄식 첫 문장
   * 행동(Action) 중심의 본문
   * 결과와 직무 적합성으로 마무리

피드백 원칙
초안을 작성한 뒤에는 다음을 함께 제공하십시오.
   * 채용담당자 관점에서 가장 강한 부분
   * 더 보완하면 좋은 부분
   * 더 설득력 있게 만들기 위해 필요한 추가 정보(있다면)

작성이 끝나면 다음 안내만 덧붙이십시오.
"초안을 검토해 보시고 수정하고 싶은 부분(분량, 강조점, 표현 등)을 말씀해 주세요. 마음에 드신다면 '다음 문항'이라고 입력해 주세요."`;

async function callAnthropic(apiKey, systemPrompt, messages) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `Anthropic 오류 (HTTP ${r.status})`);
  return { content: data.content, _provider: "anthropic" };
}

async function callOpenAI(apiKey, systemPrompt, messages) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 2000,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `OpenAI 오류 (HTTP ${r.status})`);
  const text = data.choices?.[0]?.message?.content || "";
  return { content: [{ type: "text", text }], _provider: "openai" };
}

async function callGemini(apiKey, systemPrompt, messages) {
  // Gemini는 role을 "user"/"model"로 쓰고, 시스템 프롬프트는 별도 systemInstruction 필드로 받는다.
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
      }),
    }
  );
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `Gemini 오류 (HTTP ${r.status})`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) throw new Error("Gemini 응답에 내용이 없습니다 (안전 필터에 걸렸을 수 있습니다).");
  return { content: [{ type: "text", text }], _provider: "gemini" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 허용됩니다." });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!anthropicKey && !openaiKey && !geminiKey) {
    return res.status(500).json({ error: "서버에 ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY 중 하나도 설정되어 있지 않습니다." });
  }

  const { context, messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages 배열이 필요합니다." });
  }

  const systemPrompt = ESSAY_COACH_SYSTEM_PROMPT + "\n\n---\n다음은 지원자의 실제 데이터다. 이 정보 밖의 사실은 만들어내지 마라.\n\n" + (context || "");
  let result = null;
  let lastError = null;

  if (anthropicKey) {
    try { result = await callAnthropic(anthropicKey, systemPrompt, messages); } catch (err) { lastError = err; }
  }
  if (!result && openaiKey) {
    try { result = await callOpenAI(openaiKey, systemPrompt, messages); } catch (err) { lastError = err; }
  }
  if (!result && geminiKey) {
    try { result = await callGemini(geminiKey, systemPrompt, messages); } catch (err) { lastError = err; }
  }

  if (!result) {
    return res.status(500).json({ error: lastError?.message || "AI 호출에 실패했습니다." });
  }

  return res.status(200).json(result);
}
