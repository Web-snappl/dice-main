import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@routes": path.resolve(__dirname, "./src/routes/"),
      "@pages": path.resolve(__dirname, "./src/pages/"),
      "@components": path.resolve(__dirname, "./src/components/"),
      "@hooks": path.resolve(__dirname, "./src/hooks/"),
      "@info": path.resolve(__dirname, "./src/info/"),
      "@lib": path.resolve(__dirname, "./src/lib/"),
      "@assets": path.resolve(__dirname, "./src/assets/"),
      "@theme": path.resolve(__dirname, "./src/theme/"),
      "@store": path.resolve(__dirname, "./src/store/"),
      "@functions": path.resolve(__dirname, "./src/functions/")
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
