import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Reading from "../models/Reading.js";
import { saveReading } from "../utils/store.js";
import { classifyWithAI } from "../utils/classify.js";
import { classifyWithHeuristic } from "../utils/heuristic.js";
import { fetchTrackWeather } from "../utils/weather.js";

const router = express.Router();

const uploadsDir = path.resolve("uploads");
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
// multipart/form-data with field "image", optional fields "weather", "sectorId"
router.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  const imageBuffer = fs.readFileSync(req.file.path);
  const mediaType = req.file.mimetype;
  const imageUrl = `/uploads/${req.file.filename}`;

  let result;
  let source = "ai";

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("No ANTHROPIC_API_KEY set, falling back to heuristic");
    }
    result = await classifyWithAI(imageBuffer, mediaType);
  } catch (err) {
    console.warn("AI classification failed, using heuristic fallback:", err.message);
    result = await classifyWithHeuristic(imageBuffer);
    source = "heuristic";
  }

  let weather = req.body.weather;
  if (!weather || weather.trim() === "") {
    weather = await fetchTrackWeather();
  }

  const wetnessIndex = Reading.LABEL_TO_INDEX[result.label];
  const sectorId = req.body.sectorId || "sector-1";

  const reading = await saveReading({
    imageUrl,
    label: result.label,
    wetnessIndex,
    confidence: result.confidence,
    reasoning: result.reasoning,
    source,
    weather,
    sectorId,
  });

  res.json(reading);
});

export default router;
