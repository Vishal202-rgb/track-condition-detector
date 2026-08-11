import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import Reading from "../models/Reading.js";
import { classifyWithAI } from "../utils/classify.js";
import { classifyWithHeuristic } from "../utils/heuristic.js";

const router = express.Router();

const uploadsDir = path.join(os.tmpdir(), "uploads");
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// POST /api/analyze
// multipart/form-data with field "image", optional field "weather"
router.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  const imageBuffer = fs.readFileSync(req.file.path);
  const mediaType = req.file.mimetype;
  const imageUrl = `/uploads/${req.file.filename}`;

  let result;
  let source = "ai";
  let debugReason = null;

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is missing or not loaded from .env");
    }
    result = await classifyWithAI(imageBuffer, mediaType);
  } catch (err) {
    console.error("AI classification failed, using heuristic fallback:", err.message);
    debugReason = err.message;
    result = await classifyWithHeuristic(imageBuffer);
    source = "heuristic";
  }

  const wetnessIndex = Reading.LABEL_TO_INDEX[result.label];

  const reading = await Reading.create({
    imageUrl,
    label: result.label,
    wetnessIndex,
    confidence: result.confidence,
    reasoning: result.reasoning,
    source,
    weather: req.body.weather || "",
  });

  res.json({ ...reading.toObject(), debugReason });
});

export default router;