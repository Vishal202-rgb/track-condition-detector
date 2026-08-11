import express from "express";
import { getRecentReadings, getAllReadings } from "../utils/store.js";
import { computeSlope, deriveSuggestion } from "../utils/trend.js";

const router = express.Router();

const TREND_WINDOW = parseInt(process.env.TREND_WINDOW || "10", 10);

// GET /api/trend?sector=sector-1 - recent readings + computed trend + suggestion
router.get("/", async (req, res) => {
  try {
    const sectorId = req.query.sector || null;
    const chronological = await getRecentReadings(TREND_WINDOW, sectorId);

    if (chronological.length === 0) {
      return res.json({
        readings: [],
        slope: 0,
        trendDirection: "unknown",
        suggestion: "No telemetry captured for this sector — analyze an image or run simulation.",
        sectorId,
      });
    }

    const values = chronological.map((r) => r.wetnessIndex);
    const slope = computeSlope(values);
    const latestIndex = values[values.length - 1];
    const { trendDirection, suggestion } = deriveSuggestion(slope, latestIndex);

    res.json({
      readings: chronological,
      slope,
      trendDirection,
      suggestion,
      latestLabel: chronological[chronological.length - 1].label,
      sectorId,
    });
  } catch (err) {
    console.error("Error in GET /api/trend:", err);
    res.status(500).json({ error: "Failed to compute trend" });
  }
});

// GET /api/trend/history?sector=sector-1 - full history
router.get("/history", async (req, res) => {
  try {
    const sectorId = req.query.sector || null;
    const readings = await getAllReadings(sectorId);
    res.json(readings);
  } catch (err) {
    console.error("Error in GET /api/trend/history:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
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