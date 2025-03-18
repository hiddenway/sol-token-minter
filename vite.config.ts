import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [nodePolyfills(), react()],
  build: {
    minify: "terser", // Используем Terser
    terserOptions: {
      compress: {
        drop_console: true, // Удаляет console.log
      },
      mangle: true, // Переименовывает переменные
      format: {
        comments: false, // Убирает комментарии
      },
    },
  },
});
