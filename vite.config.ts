import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE_PATH || "/";

  return {
    base,
    plugins: [react()],
    build: {
      target: "es2022",
      sourcemap: mode !== "production",
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            animation: ["framer-motion"],
            audio: ["tone"],
            state: ["zustand"]
          }
        }
      }
    },
    server: {
      port: Number(env.VITE_DEV_PORT || 5173),
      host: "0.0.0.0"
    }
  };
});
