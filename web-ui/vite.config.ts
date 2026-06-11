import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    proxy: {
      '/api/workflow': 'https://msa26-peer-review.fh-wedel.dev',
      '/api/matching': 'https://msa26-peer-review.fh-wedel.dev',
      '/api/configuration': 'https://msa26-peer-review.fh-wedel.dev'
    }
  }
});
