import express from "express";
import { saveReading } from "../utils/store.js";
import Reading from "../models/Reading.js";

const router = express.Router();

const SAMPLE_SEED_DATA = [
  { label: "Wet", confidence: 0.94, reasoning: "Standing water and puddles across track sector", sectorId: "sector-1", weather: "Heavy Rain 18°C" },
  { label: "Wet", confidence: 0.91, reasoning: "High surface water reflection", sectorId: "sector-1", weather: "Rain 19°C" },
  { label: "Damp", confidence: 0.88, reasoning: "Moisture evaporating, dark glossy sheen", sectorId: "sector-1", weather: "Overcast 22°C" },
  { label: "Drying", confidence: 0.85, reasoning: "Dry racing line forming on Turn 3 apex", sectorId: "sector-1", weather: "Partly Cloudy 24°C" },
  { label: "Dry", confidence: 0.96, reasoning: "Matte dry surface across main line", sectorId: "sector-1", weather: "Sunny 28°C" },

  { label: "Wet", confidence: 0.92, reasoning: "Heavy puddle in chicane curb", sectorId: "sector-2", weather: "Rain 19°C" },
  { label: "Damp", confidence: 0.87, reasoning: "Moist surface, slick threshold", sectorId: "sector-2", weather: "Overcast 22°C" },
  { label: "Dry", confidence: 0.95, reasoning: "Chicane fully dry", sectorId: "sector-2", weather: "Sunny 28°C" },

  { label: "Drying", confidence: 0.83, reasoning: "Main straight drying rapidly under wind", sectorId: "sector-3", weather: "Windy 26°C" },
  { label: "Dry", confidence: 0.98, reasoning: "Optimum dry line, 100% grip", sectorId: "sector-3", weather: "Sunny 29°C" },
];

router.post("/", async (req, res) => {
  try {
    const created = [];
    const now = Date.now();
    for (let i = 0; i < SAMPLE_SEED_DATA.length; i++) {
      const item = SAMPLE_SEED_DATA[i];
      const timestamp = new Date(now - (SAMPLE_SEED_DATA.length - i) * 60000);
      const wetnessIndex = Reading.LABEL_TO_INDEX[item.label];

      const doc = await saveReading({
        imageUrl: "/uploads/sample_seed.jpg",
        wetnessIndex,
        source: "heuristic",
        timestamp,
        ...item,
      });
      created.push(doc);
    }
    res.json({ message: "Successfully seeded sample track telemetry data", count: created.length, data: created });
  } catch (err) {
    console.error("Error seeding telemetry data:", err);
    res.status(500).json({ error: "Failed to seed telemetry data" });
  }
});

export default router;
