import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "@leadconnector/vibe-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.GITHUB_ACTIONS ? "/popup-crafter/" : "/",
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [".modal.host"],
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && process.platform !== "win32" && componentTagger({ tailwindConfig: true }),
  ].filter(Boolean),
  build: {
    rollupOptions: { output: { manualChunks(id) { if (id.includes("node_modules/@supabase/")) return "supabase"; } } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
