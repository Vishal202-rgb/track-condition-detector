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

const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});

// Handle tRPC requests under any path prefix (/api/trpc, /trpc, or rewritten paths)
app.use((req, res, next) => {
  if (req.url.startsWith("/api/trpc")) {
    return trpcMiddleware(req, res, next);
  }
  if (req.url.startsWith("/trpc")) {
    req.url = "/api" + req.url;
    return trpcMiddleware(req, res, next);
  }
  const urlToTest = req.originalUrl || req.url;
  if (urlToTest.includes("trpc")) {
    const procedure = urlToTest.split("/trpc")[1] || "";
    req.url = "/api/trpc" + procedure;
    return trpcMiddleware(req, res, next);
  }
  next();
});

// Global error handler to return JSON on serverless function errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[API Error]", err);
  res.status(500).json({ error: "Internal Server Error", message: err?.message || String(err) });
});

export default app;
