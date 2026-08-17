// 브랜딩 워크북 — 산출물 생성 (SYNTHESIZE): 포지셔닝/헤드라인/아키타입/콘텐츠 기둥

const SYSTEM_PREFIX = `- 반드시 JSON만 출력한다. 마크다운 코드펜스, 설명, 인사말을 붙이지 않는다.
- 사용자를 칭찬하지 않는다.
- 한국어로 작성한다.
- 사용자가 확정한 정보 밖의 내용을 지어내지 않는다.`;

function buildPrompt({ confirmedItems, rejectedItems, staleCount, coverage }) {
  return `${SYSTEM_PREFIX}

너는 퍼스널 브랜딩 전략가다. 사용자가 확정한 프로필 항목만으로 산출물을 만든다.
확정되지 않은 정보나 일반론을 끌어오지 않는다.

[입력]
확정 항목: ${JSON.stringify(confirmedItems || [])}
기각된 항목 (이 방향은 피할 것): ${JSON.stringify(rejectedItems || [])}
stale 항목 수: ${staleCount || 0}
카테고리별 응답 현황: ${JSON.stringify(coverage || {})}

[생성 규칙]

positioning (3안)
공식: "나는 [타겟]이 [문제]를 해결하도록 [방법]으로 돕는 [역할]이다"
- 3안은 서로 다른 축이어야 한다. 표현만 바꾼 건 실패.
  A: 강점 중심 / B: 가치관 중심 / C: 타겟 좁힘 중심
- 각 안마다 based_on에 근거 항목 id를 넣는다.
- 자기 이름을 동료 이름으로 바꿔도 말이 되는 문장은 만들지 않는다.

headline (3안)
- 15자 내외. 직함 나열 금지. 대조 구조 우선. 이게 곧 "한 줄 슬로건" 역할을 한다.

archetype
- 12원형 중 주 1개 + 보조 1개. 근거 항목 명시.
- 돌보는자/통치자/순수한자/탐험가/현자/반항아/영웅/마법사/창조자/광대/평범한사람/연인

pillars (4개)
- 전문지식 40 / 경험담 30 / 관점 20 / 인간미 10
- 각 기둥마다 실제 만들 수 있는 콘텐츠 주제 3개

gaps
- 부족한 카테고리를 지적한다.
- confidence: low 항목이 포지셔닝에 쓰였으면 반드시 경고한다.
- stale_count > 0 이면 "재확인 필요한 항목 N개가 제외됨"을 gaps에 넣는다.

[출력 - JSON only]
{
  "positioning": [{"axis":"강점","text":"...","based_on":["item_id"],"risk":"..."}],
  "headline": [{"text":"...","based_on":["item_id"]}],
  "archetype": {"primary":"창조자","secondary":"현자","reason":"...","tone":["...","..."]},
  "pillars": [{"name":"전문지식","topic":"...","weight":40,"examples":["...","...","..."]}],
  "gaps": ["..."]
}`;
}

async function callAnthropic(apiKey, prompt) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2000, temperature: 0.5, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `Anthropic 오류 (HTTP ${r.status})`);
  return { content: data.content, _provider: "anthropic" };
}
async function callOpenAI(apiKey, prompt) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 2000, temperature: 0.5, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `OpenAI 오류 (HTTP ${r.status})`);
  return { content: [{ type: "text", text: data.choices?.[0]?.message?.content || "" }], _provider: "openai" };
}
async function callGemini(apiKey, prompt) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.5 } }),
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

  const { confirmedItems, rejectedItems, staleCount, coverage } = req.body || {};
  if (!confirmedItems || confirmedItems.length === 0) return res.status(400).json({ error: "confirmedItems가 필요합니다." });

  const prompt = buildPrompt({ confirmedItems, rejectedItems, staleCount, coverage });
  let result = null, lastError = null;
  if (anthropicKey) { try { result = await callAnthropic(anthropicKey, prompt); } catch (e) { lastError = e; } }
  if (!result && openaiKey) { try { result = await callOpenAI(openaiKey, prompt); } catch (e) { lastError = e; } }
  if (!result && geminiKey) { try { result = await callGemini(geminiKey, prompt); } catch (e) { lastError = e; } }
  if (!result) return res.status(500).json({ error: lastError?.message || "AI 호출에 실패했습니다." });
  return res.status(200).json(result);
}
