import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // vercel dev 는 랜덤 포트를 PORT 로 넘겨주고 그 포트를 듣기를 기대한다.
    // 하드코딩하면 vercel dev 가 서버를 못 찾고 죽는다.
    port: Number(process.env.PORT) || 5173,
  },
});
