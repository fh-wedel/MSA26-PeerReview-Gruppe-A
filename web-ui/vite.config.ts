import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Helper to decode JWT locally for header injection
function parseJwt(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch (e) {
    return null;
  }
}

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    proxy: {
      "/api/workflow": "http://workflow-service:8080",
      "/api/configuration": {
        target: "http://configuration-service:8080",
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq, req, res) => {
            const authHeader = req.headers["authorization"];
            if (authHeader && authHeader.startsWith("Bearer ")) {
              const token = authHeader.split(" ")[1];
              const decoded = parseJwt(token);
              if (decoded) {
                // Inject the headers the backend expects
                proxyReq.setHeader(
                  "x-auth-username",
                  decoded.username || "DemoUser",
                );
                proxyReq.setHeader(
                  "x-auth-groups",
                  (decoded["cognito:groups"] || []).join(","),
                );
                proxyReq.setHeader(
                  "x-auth-principal-id",
                  decoded.sub || "demo-sub",
                );
              }
            }
          });
        },
      },
    },
  },
});
