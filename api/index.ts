import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerStorageProxy(app);
registerOAuthRoutes(app);

const trpcMiddleware = createExpressMiddleware({ router: appRouter, createContext });

// The Vercel rewrite may preserve or strip the /api prefix. Normalize both forms.
app.use((req, res, next) => {
  if (req.url.startsWith("/api/trpc")) return trpcMiddleware(req, res, next);
  if (req.url.startsWith("/trpc")) {
    req.url = `/api${req.url}`;
    return trpcMiddleware(req, res, next);
  }
  const originalUrl = req.originalUrl || req.url;
  if (originalUrl.includes("/trpc")) {
    req.url = `/api/trpc${originalUrl.split("/trpc")[1] || ""}`;
    return trpcMiddleware(req, res, next);
  }
  next();
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[API Error]", error);
  res.status(500).json({ error: "Internal Server Error", message: error instanceof Error ? error.message : String(error) });
});

export default app;
