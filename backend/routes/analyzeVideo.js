import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import Reading from "../models/Reading.js";
import { classifyWithAI } from "../utils/classify.js";
import { classifyWithHeuristic } from "../utils/heuristic.js";
import { extractFrames } from "../utils/videoFrames.js";

const router = express.Router();

const uploadsDir = path.join(os.tmpdir(), "uploads");
const framesDir = path.join(os.tmpdir(), "uploads", "frames");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB, videos are bigger than images
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      return cb(new Error("Only video files are allowed"));
    }
    cb(null, true);
  },
});

const MAX_FRAMES = 15;
const SAMPLE_FPS = 0.5;

// POST /api/analyze-video
// multipart/form-data with field "video"
router.post("/", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video file provided" });
  }

  const videoPath = req.file.path;
  const jobDir = path.join(framesDir, path.parse(req.file.filename).name);

  try {
    const allFramePaths = await extractFrames(videoPath, jobDir, SAMPLE_FPS);
    const framePaths = allFramePaths.slice(0, MAX_FRAMES);

    if (framePaths.length === 0) {
      return res.status(400).json({ error: "Could not extract any frames from video" });
    }

    const readings = [];
    const baseTime = Date.now();

    for (let i = 0; i < framePaths.length; i++) {
      const framePath = framePaths[i];
      const imageBuffer = fs.readFileSync(framePath);

      let result;
      let source = "ai";
      try {
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error("No ANTHROPIC_API_KEY set, falling back to heuristic");
        }
        result = await classifyWithAI(imageBuffer, "image/jpeg");
      } catch (err) {
        console.warn(`Frame ${i} AI classification failed, using heuristic:`, err.message);
        result = await classifyWithHeuristic(imageBuffer);
        source = "heuristic";
      }

      const wetnessIndex = Reading.LABEL_TO_INDEX[result.label];
      const publicFrameName = `${path.parse(req.file.filename).name}-frame-${i}.jpg`;
      fs.copyFileSync(framePath, path.join(uploadsDir, publicFrameName));

      const reading = await Reading.create({
        imageUrl: `/uploads/${publicFrameName}`,
        label: result.label,
        wetnessIndex,
        confidence: result.confidence,
        reasoning: result.reasoning,
        source,
        timestamp: new Date(baseTime + i * 1000),
      });

      readings.push(reading);
    }

    fs.rmSync(jobDir, { recursive: true, force: true });

    res.json({ framesProcessed: readings.length, readings });
  } catch (err) {
    console.error("Video analysis failed:", err);
    res.status(500).json({ error: err.message || "Video processing failed" });
  }
});

export default router;