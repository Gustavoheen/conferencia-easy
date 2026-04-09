import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import path from "path";
import fs from "fs";

function serveStatic(app: Express) {
  // In Vercel serverless, __dirname points to the function's directory
  // The built frontend is at dist/public relative to project root
  const distPath = path.resolve(
    process.env.VERCEL
      ? path.join(process.cwd(), "dist", "public")
      : path.resolve(path.dirname(import.meta.url.replace("file://", "")), "../..", "dist", "public")
  );

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
}

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  serveStatic(app);
  return app;
}
