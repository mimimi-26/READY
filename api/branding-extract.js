// 브랜딩 워크북 — 꼬리질문 생성 (FOLLOWUP)
// Anthropic → OpenAI → Gemini 순으로 시도 (기존 api/extract.js와 동일한 폴백 패턴)

const SYSTEM_PREFIX = `- 반드시 JSON만 출력한다. 마크다운 코드펜스, 설명, 인사말을 붙이지 않는다.
- 사용자를 칭찬하지 않는다. "좋은 답변이에요" 류 표현 금지.
- 한국어 반말로 작성한다.
- 사용자가 쓰지 않은 사실을 만들어내지 않는다.`;

function buildPrompt({ question, entry, siblingEntries, depth, confirmedProfileSummary }) {
  return `${SYSTEM_PREFIX}

너는 퍼스널 브랜딩 코치다. 사용자의 답변이 브랜딩 재료로 쓸 만큼 구체적인지
판정하고, 필요하면 꼬리질문 1개를 만든다.

[입력]
원질문: ${question.text}
질문 의도: ${question.hint || ""}
파고들 방향: ${question.probe || ""}

이번 답변(엔트리): ${entry.content}
이번 엔트리 라벨: ${entry.label || "null"}
같은 질문의 이전 답변들: ${JSON.stringify(siblingEntries || [])}
현재 depth: ${depth}
확정된 프로필 요약: ${confirmedProfileSummary || "(없음)"}

[판정 기준 — 하나라도 해당하면 needs_followup = true]
- 형용사·추상명사만 있고 장면·숫자·고유명사가 없다
- 강점을 주장하는데 근거가 없다
- 결론만 있고 판단 과정이 없다
- 기존 프로필 또는 이전 엔트리와 모순된다
- 답변 안에 더 캘 만한 고유한 디테일이 있다

[needs_followup = false 로 둘 때]
- 이미 장면·숫자·인물이 구체적이고 더 물어도 반복만 될 때
- depth가 1인데 답변이 충분히 깊어졌을 때

[멀티 엔트리 규칙]
- sibling_entries가 있으면, 거기서 이미 물어본 것과 겹치는 질문을 만들지 않는다.
- 이전 엔트리와 이번 엔트리의 답이 다르면, 그 변화 자체를 묻는 것을 우선한다.
- 이전 엔트리와 같은 내용이 반복되면, 반복 그 자체를 짚어 패턴을 확인한다.

[꼬리질문 작성 규칙]
- 반드시 1개만. 두 가지를 묻지 않는다.
- 예/아니오로 끝나는 질문 금지
- "왜 그렇게 생각해?" 같은 범용 질문 금지. 답변에 나온 단어를 인용해서 묻는다.
- 칭찬·공감 문구 금지. 바로 질문으로 들어간다.
- 40자 이내

[probe_type]
concretize : 추상 → 구체 (장면·숫자 요구)
evidence   : 주장 → 근거 (제3자·결과 요구)
pattern    : 1회성 → 반복성 (다른 사례 요구)
contrast   : 반대 사례로 경계 확인
contradict : 기존 프로필 또는 이전 엔트리와의 모순 지적 (몰아붙이지 말고 사실만 병치)
cost       : 트레이드오프 확인 (뭘 포기했는지)

[출력 - JSON only]
{"needs_followup": true, "probe_type": "concretize", "question": "...", "reason": "..."}
또는
{"needs_followup": false, "probe_type": null, "question": null, "reason": "..."}`;
}

async function callAnthropic(apiKey, prompt) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 300, temperature: 0.7, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `Anthropic 오류 (HTTP ${r.status})`);
  return { content: data.content, _provider: "anthropic" };
}
async function callOpenAI(apiKey, prompt) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 300, temperature: 0.7, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `OpenAI 오류 (HTTP ${r.status})`);
  return { content: [{ type: "text", text: data.choices?.[0]?.message?.content || "" }], _provider: "openai" };
}
async function callGemini(apiKey, prompt) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.7 } }),
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

  const { question, entry, siblingEntries, depth, confirmedProfileSummary } = req.body || {};
  if (!question || !entry) return res.status(400).json({ error: "question, entry가 필요합니다." });

  const prompt = buildPrompt({ question, entry, siblingEntries, depth, confirmedProfileSummary });
  let result = null, lastError = null;
  if (anthropicKey) { try { result = await callAnthropic(anthropicKey, prompt); } catch (e) { lastError = e; } }
  if (!result && openaiKey) { try { result = await callOpenAI(openaiKey, prompt); } catch (e) { lastError = e; } }
  if (!result && geminiKey) { try { result = await callGemini(geminiKey, prompt); } catch (e) { lastError = e; } }
  if (!result) return res.status(500).json({ error: lastError?.message || "AI 호출에 실패했습니다." });
  return res.status(200).json(result);
}
