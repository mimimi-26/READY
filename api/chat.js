// Vercel Serverless Function — 챗봇(자소서 작성 도우미, 경험 진단 등) 프록시
// API 키는 서버에만 존재한다. 시스템 프롬프트는 클라이언트(App.jsx)가 용도에 맞게 구성해 보내고,
// 서버는 그 프롬프트 + 참고 데이터를 합쳐 AI에 전달하는 역할만 한다 (프롬프트 자체는 민감정보가 아님).
// 순서: Anthropic(Claude) → OpenAI(GPT) → Google Gemini 순으로 시도한다.
// GEMINI_API_KEY는 https://aistudio.google.com/apikey 에서 카드 등록 없이 무료로 발급 가능하다.

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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 2048 },
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

  const { systemPrompt: clientSystemPrompt, context, messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages 배열이 필요합니다." });
  }
  if (!clientSystemPrompt) {
    return res.status(400).json({ error: "systemPrompt가 필요합니다." });
  }

  const systemPrompt = clientSystemPrompt + "\n\n---\n다음은 참고할 실제 데이터다. 이 정보 밖의 사실은 만들어내지 마라.\n\n" + (context || "");
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
