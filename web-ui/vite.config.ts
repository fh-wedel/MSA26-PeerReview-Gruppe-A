import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://msa26-peer-review.fh-wedel.dev',
    }
  }
});
