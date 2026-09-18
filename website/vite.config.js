import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  return {
    plugins: [react()],
    envDir: __dirname,
    define: {
      "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(
        (env.VITE_GOOGLE_CLIENT_ID ||
          "470949991659-kq78v41kdm7ut9ivie0ul634hgj8bgd7.apps.googleusercontent.com")
          .split(",")[0]
          .trim()
      ),
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
        (env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "")
      ),
    },
    server: { port: 5173, host: true },
  };
});
