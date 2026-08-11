import express from "express";
import Reading from "../models/Reading.js";
import { computeSlope, deriveSuggestion, computeEta } from "../utils/trend.js";
import { deriveRiskLevel } from "../utils/riskLevel.js";
import { checkWeatherMismatch } from "../utils/weatherCheck.js";

const router = express.Router();

const TREND_WINDOW = parseInt(process.env.TREND_WINDOW || "10", 10);

router.get("/", async (req, res) => {
  const readings = await Reading.find()
    .sort({ timestamp: -1 })
    .limit(TREND_WINDOW)
    .lean();

  const chronological = readings.reverse();

  if (chronological.length === 0) {
    return res.json({
      readings: [],
      slope: 0,
      trendDirection: "unknown",
      suggestion: "No readings yet — upload an image to get started",
      etaMinutes: null,
      etaLabel: null,
      riskLevel: null,
      weatherAlert: null,
    });
  }

  const values = chronological.map((r) => r.wetnessIndex);
  const slope = computeSlope(values);
  const latest = chronological[chronological.length - 1];
  const latestIndex = latest.wetnessIndex;

  const { trendDirection, suggestion } = deriveSuggestion(slope, latestIndex);
  const { etaMinutes, etaLabel } = computeEta(chronological);
  const riskLevel = deriveRiskLevel(latestIndex, trendDirection);
  const weatherAlert = checkWeatherMismatch(latest.weather, latestIndex);

  res.json({
    readings: chronological,
    slope,
    trendDirection,
    suggestion,
    latestLabel: latest.label,
    etaMinutes,
    etaLabel,
    riskLevel,
    weatherAlert,
  });
});

router.get("/history", async (req, res) => {
  const readings = await Reading.find().sort({ timestamp: 1 }).lean();
  res.json(readings);
});

router.delete("/history", async (req, res) => {
  try {
    const result = await Reading.deleteMany({});
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to clear history" });
  }
});

export default router;