// 브랜딩 워크북 — 프로필 항목 추출 (EXTRACT)

const SYSTEM_PREFIX = `- 반드시 JSON만 출력한다. 마크다운 코드펜스, 설명, 인사말을 붙이지 않는다.
- 사용자를 칭찬하지 않는다.
- 한국어로 작성한다 (content는 명사구).
- 사용자가 쓰지 않은 사실을 만들어내지 않는다.`;

function buildPrompt({ question, entry, followups, siblingEntries, existingItems }) {
  return `${SYSTEM_PREFIX}

사용자의 답변에서 브랜딩 프로필 항목을 추출한다.
추측하지 말고, 답변에 실제로 있는 내용만 뽑는다.

[입력]
질문: ${question.text}
이번 엔트리: ${entry.content}
이번 엔트리 꼬리질문/답변: ${JSON.stringify(followups || [])}
같은 질문의 이전 엔트리들: ${JSON.stringify(siblingEntries || [])}
기존 프로필 항목: ${JSON.stringify((existingItems || []).map(i => ({ id: i.id, type: i.type, content: i.content })))}

[추출 규칙]
- 한 엔트리에서 최대 3개까지. 억지로 채우지 않는다. 0개도 정상이다.
- 각 항목은 25자 이내 명사구. 문장 금지.
- evidence에는 답변 원문에서 그대로 가져온 근거 구절을 넣는다.
- 기존 항목과 같은 내용이면 새로 만들지 말고 merge_into에 기존 id를 넣는다.
- 기존 항목과 충돌하면 conflicts_with에 기존 id를 넣는다.
- 이전 엔트리에서 이미 나온 내용이 반복되면 confidence를 한 단계 올린다.

[type]
strength / weakness / value / pattern / evidence / taste / motivation

[confidence]
high   : 구체적 사례 2개 이상, 또는 타인 증언 있음, 또는 여러 엔트리에서 반복
medium : 사례 1개
low    : 본인 주장만 있음

[출력 - JSON only]
{"items":[{"type":"strength","content":"...","confidence":"medium","evidence":"...","merge_into":null,"conflicts_with":null}]}`;
}

async function callAnthropic(apiKey, prompt) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 600, temperature: 0.2, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `Anthropic 오류 (HTTP ${r.status})`);
  return { content: data.content, _provider: "anthropic" };
}
async function callOpenAI(apiKey, prompt) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 600, temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `OpenAI 오류 (HTTP ${r.status})`);
  return { content: [{ type: "text", text: data.choices?.[0]?.message?.content || "" }], _provider: "openai" };
}
async function callGemini(apiKey, prompt) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `Gemini 오류 (HTTP ${r.status})`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) throw new Error("Gemini 응답에 내용이 없습니다.");
  return { content: [{ type: "text", text }], _provider: "gemini" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST 요청만 허용됩니다." });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!anthropicKey && !openaiKey && !geminiKey) {
    return res.status(500).json({ error: "서버에 AI API 키가 하나도 설정되어 있지 않습니다." });
  }

  const { question, entry, followups, siblingEntries, existingItems } = req.body || {};
  if (!question || !entry) return res.status(400).json({ error: "question, entry가 필요합니다." });

  const prompt = buildPrompt({ question, entry, followups, siblingEntries, existingItems });
  let result = null, lastError = null;
  if (anthropicKey) { try { result = await callAnthropic(anthropicKey, prompt); } catch (e) { lastError = e; } }
  if (!result && openaiKey) { try { result = await callOpenAI(openaiKey, prompt); } catch (e) { lastError = e; } }
  if (!result && geminiKey) { try { result = await callGemini(geminiKey, prompt); } catch (e) { lastError = e; } }
  if (!result) return res.status(500).json({ error: lastError?.message || "AI 호출에 실패했습니다." });
  return res.status(200).json(result);
}
