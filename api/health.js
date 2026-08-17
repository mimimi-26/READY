// 서버에 어떤 AI 키가 등록되어 있는지만 알려주는 헬스체크.
// 키 값 자체는 절대 반환하지 않고, 존재 여부(boolean)만 반환한다.
export default async function handler(req, res) {
  return res.status(200).json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    supabaseEnvHint: "VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY는 클라이언트 값이라 서버에서 확인하지 않습니다.",
  });
}
