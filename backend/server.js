import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import os from "os";

import analyzeRouter from "./routes/analyze.js";
import analyzeVideoRouter from "./routes/analyzeVideo.js";
import trendRouter from "./routes/trend.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(os.tmpdir(), "uploads")));

app.use("/api/analyze", analyzeRouter);
app.use("/api/analyze-video", analyzeVideoRouter);
app.use("/api/trend", trendRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Something went wrong" });
});

async function start() {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB");
    } else {
      console.warn(
        "No MONGODB_URI set — copy .env.example to .env and add your connection string"
      );
    }
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();