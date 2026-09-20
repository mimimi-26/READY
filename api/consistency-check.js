// Vercel Serverless Function — 경험 단계별 일관성 검토 프록시
// 검토 프롬프트는 클라이언트(App.jsx)가 경험 단계들을 모아 구성해 보내고, 서버는 그대로 AI에 전달한다.
// 순서: Anthropic(Claude) → OpenAI(GPT) → Google Gemini 순으로 시도한다.

async function callAnthropic(apiKey, prompt) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1500, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `Anthropic 오류 (HTTP ${r.status})`);
  return { content: data.content, _provider: "anthropic" };
}

async function callOpenAI(apiKey, prompt) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini", max_tokens: 1500,
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
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

  const { prompt } = req.body || {};
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "prompt가 비어 있습니다." });
  }

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
