// Vercel Serverless Function
// 역할: 브라우저가 아닌 서버에서 AI API를 호출해 키가 클라이언트에 노출되지 않도록 한다.
// 순서: Anthropic(Claude) → OpenAI(GPT) → Google Gemini 순으로 시도하고,
// 앞 단계가 실패하면(토큰 소진·오류 등) 자동으로 다음으로 전환한다.
// 배포 시 Vercel 프로젝트 설정 > Environment Variables 에 아래 중 최소 하나를 등록해야 한다.
//   ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY
// GEMINI_API_KEY는 https://aistudio.google.com/apikey 에서 카드 등록 없이 무료로 발급 가능하다.
// 단, Gemini 무료 등급은 입력·출력 데이터를 모델 학습에 활용할 수 있다는 약관이 있으니 참고할 것.

function buildPrompt(raw) {
  return `아래는 정형화되지 않은 이력서/경험 정리 문서다. 원문은 자유 텍스트일 수도, 표/CSV 형식(엑셀에서 변환됨)일 수도 있다. 내용을 추출해 JSON으로만 응답하라. 마크다운 백틱 없이 순수 JSON만.
규칙:
- 없는 정보를 지어내지 마라. 원문에 없는 수치·성과 생성 금지.
- 모호한 수치("~정도", 단위 불명확)는 metrics에 넣되 certainty를 "needs_verification"으로, note에 이유를 적어라. 확실한 표현이어도 근거 자료가 없으므로 certainty는 항상 "needs_verification".
- 각 경험은 별도 항목으로 분리하라 (한 인턴십 안의 여러 프로젝트도 각각).
- 각 경험에 대해, 그 경험이 보여주는 역량을 2~4개 정도 competencies에 추정해서 넣어라 (원문에 명시되지 않아도, 서술된 행동에서 합리적으로 추론 가능하면 넣는다. 단, 과장하지 말고 일반적인 명사형 역량명으로).
- profile에는 이름·이메일뿐 아니라, 원문에 지원 직무나 목표 직무가 명시되어 있다면 targetRole에도 담아라 (없으면 빈 문자열).
스키마:
{"experiences":[{"title":"","organization":"","role":"","experienceType":"internship|full_time|part_time|school_project|club|competition|external_activity|personal_project|other","startDate":"YYYY-MM","endDate":"YYYY-MM","rawNote":"","competencies":[""],"metrics":[{"metricName":"","changeValue":숫자|null,"beforeValue":숫자|null,"afterValue":숫자|null,"unit":"","certainty":"needs_verification","note":""}]}],"skills":[{"name":"","category":"tool|skill","scopeItems":[{"text":"","evidenceExpId":null}]}],"certs":[{"name":"","issuer":"","date":"","note":""}],"profile":{"name":"","email":"","targetRole":""}}

원문:
${raw}`;
}

async function callAnthropic(apiKey, prompt) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `Anthropic 오류 (HTTP ${r.status})`);
  return { content: data.content, _provider: "anthropic" };
}

async function callOpenAI(apiKey, prompt) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `OpenAI 오류 (HTTP ${r.status})`);
  const text = data.choices?.[0]?.message?.content || "";
  return { content: [{ type: "text", text }], _provider: "openai" };
}

async function callGemini(apiKey, prompt) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
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

  const { raw } = req.body || {};
  if (!raw || !raw.trim()) {
    return res.status(400).json({ error: "raw 텍스트가 비어 있습니다." });
  }

  const prompt = buildPrompt(raw);
  let result = null;
  let lastError = null;

  if (anthropicKey) {
    try { result = await callAnthropic(anthropicKey, prompt); } catch (err) { lastError = err; }
  }
  if (!result && openaiKey) {
    try { result = await callOpenAI(openaiKey, prompt); } catch (err) { lastError = err; }
  }
  if (!result && geminiKey) {
    try { result = await callGemini(geminiKey, prompt); } catch (err) { lastError = err; }
  }

  if (!result) {
    return res.status(500).json({ error: lastError?.message || "AI 호출에 실패했습니다." });
  }

  return res.status(200).json(result);
}
