import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // listen on 0.0.0.0 (needed when accessed via domain / reverse proxy)
    port: 5173, // change if your UI uses a different port
    strictPort: true,
    allowedHosts: [
      "dev-isladmin.vachanengine.org",
      "api.dev-isladmin.vachanengine.org",
      "localhost",
      "127.0.0.1",
    ],
  },
})