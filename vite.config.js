import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
  },
  server: {
    // Suprimir advertencias de source maps faltantes
    hmr: {
      overlay: true,
    },
  },
  // Ignorar advertencias de source maps para recursos de Genially
  css: {
    devSourcemap: false,
  },
});
