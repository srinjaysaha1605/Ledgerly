import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import verifyTurnstileHandler from "./api/verify-turnstile";
import geminiInsightsHandler from "./api/gemini/insights";
import geminiAdvisorHandler from "./api/gemini/advisor";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "10mb" }));

  // Re-use self-contained Vercel serverless handlers for local Express development
  app.post("/api/verify-turnstile", (req, res) => verifyTurnstileHandler(req, res));
  app.post("/api/gemini/insights", (req, res) => geminiInsightsHandler(req, res));
  app.post("/api/gemini/advisor", (req, res) => geminiAdvisorHandler(req, res));

  // Health check API
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware in dev mode, static serving in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ledgerly server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
