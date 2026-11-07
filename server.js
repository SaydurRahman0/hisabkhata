import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import app from "./backend/src/app.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./backend/src/config/database.js";

const PORT = 3000;
let server = null;

async function startServer() {
  // Attempt database connection (safe non-blocking in development)
  await connectDatabase().catch((err) => {
    console.warn(
      "[HisabKhata DB] Database not connected on startup:",
      err.message,
    );
  });

  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    // Mount Vite dev server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    const distPath = path.resolve(import.meta.dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  server = app.listen(PORT, () => {
    console.log(
      `[HisabKhata Full-Stack] Server listening on http://localhost:${PORT}`,
    );
    console.log(
      `[HisabKhata Full-Stack] Health check: http://localhost:${PORT}/api/health`,
    );
    console.log(
      `[HisabKhata Full-Stack] Current user API: http://localhost:${PORT}/api/auth/me`,
    );
  });
}

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n[HisabKhata Full-Stack] Received ${signal}. Shutting down...`);
  if (server) {
    server.close();
  }
  await disconnectDatabase();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((err) => {
  console.error("[HisabKhata Full-Stack] Fatal startup failure:", err);
  process.exit(1);
});
