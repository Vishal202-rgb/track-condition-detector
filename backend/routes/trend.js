// import express from "express";
// import mongoose from "mongoose";
// import Reading from "../models/Reading.js";
// import { computeSlope, deriveSuggestion } from "../utils/trend.js";

// const router = express.Router();

// const TREND_WINDOW = parseInt(process.env.TREND_WINDOW || "10", 10);

// function asText(value, fallback = "") {
//   if (typeof value === "string" || typeof value === "number") {
//     return String(value);
//   }
//   if (value && typeof value === "object" && typeof value.message === "string") {
//     return value.message;
//   }
//   return fallback;
// }

// function emptyTrendResponse(message = "No readings yet — upload an image to get started") {
//   return {
//     readings: [],
//     slope: 0,
//     trendDirection: "unknown",
//     suggestion: message,
//     latestLabel: "",
//   };
// }

// // GET /api/trend - recent readings + computed trend + suggestion
// router.get("/", async (req, res) => {
//   if (mongoose.connection.readyState !== 1) {
//     return res.json(
//       emptyTrendResponse("Trend temporarily unavailable: database is reconnecting")
//     );
//   }

//   try {
//     const readings = await Reading.find()
//       .sort({ timestamp: -1 })
//       .limit(TREND_WINDOW)
//       .lean();

//     // Reverse so it's oldest -> newest for slope + chart purposes
//     const chronological = readings.reverse();

//     if (chronological.length === 0) {
//       return res.json(emptyTrendResponse());
//     }

//     const values = chronological.map((r) => r.wetnessIndex);
//     const slope = computeSlope(values);
//     const latestIndex = values[values.length - 1];
//     const { trendDirection, suggestion } = deriveSuggestion(slope, latestIndex);

//     res.json({
//       readings: chronological,
//       slope,
//       trendDirection,
//       suggestion: asText(suggestion, "Unable to derive suggestion"),
//       latestLabel: asText(chronological[chronological.length - 1].label, ""),
//     });
//   } catch (err) {
//     console.error("Failed to build trend response:", err);
//     return res.status(500).json({
//       ...emptyTrendResponse("Unable to load trend right now"),
//       error: asText(err?.message, "Unknown trend error"),
//     });
//   }
// });

// // GET /api/history - full history (for a longer chart / audit view)
// router.get("/history", async (req, res) => {
//   if (mongoose.connection.readyState !== 1) {
//     return res.json([]);
//   }
//   try {
//     const readings = await Reading.find().sort({ timestamp: 1 }).lean();
//     res.json(readings);
//   } catch (err) {
//     console.error("Failed to load history:", err);
//     res.status(500).json({ error: asText(err?.message, "Failed to load history") });
//   }
// });

// // DELETE /api/trend/history - clears all readings (careful: irreversible).
// // A confirmation token is required in the JSON body so a stray or automated
// // request can't wipe the entire reading history by accident.
// router.delete("/history", async (req, res) => {
//   const expectedToken = process.env.CLEAR_HISTORY_TOKEN || "clear-history";
//   const { token } = (req.body && typeof req.body === "object") ? req.body : {};
//   if (!token || token !== expectedToken) {
//     return res.status(400).json({
//       error: "Confirmation token required — send { token } in the JSON body",
//     });
//   }
//   try {
//     const result = await Reading.deleteMany({});
//     res.json({ deletedCount: result.deletedCount });
//   } catch (err) {
//     res.status(500).json({ error: err.message || "Failed to clear history" });
//   }
// });

// export default router;
// import express from "express";
// import mongoose from "mongoose";
// import Reading from "../models/Reading.js";
// import { computeSlope, deriveSuggestion } from "../utils/trend.js";

// const router = express.Router();

// const TREND_WINDOW = parseInt(process.env.TREND_WINDOW || "10", 10);

// function asText(value, fallback = "") {
//   if (typeof value === "string" || typeof value === "number") {
//     return String(value);
//   }
//   if (value && typeof value === "object" && typeof value.message === "string") {
//     return value.message;
//   }
//   return fallback;
// }

// function emptyTrendResponse(message = "No readings yet — upload an image to get started") {
//   return {
//     readings: [],
//     slope: 0,
//     trendDirection: "unknown",
//     suggestion: message,
//     latestLabel: "",
//   };
// }

// // GET /api/trend - recent readings + computed trend + suggestion
// router.get("/", async (req, res) => {
//   if (mongoose.connection.readyState !== 1) {
//     return res.json(
//       emptyTrendResponse("Trend temporarily unavailable: database is reconnecting")
//     );
//   }

//   try {
//     const readings = await Reading.find()
//       .sort({ timestamp: -1 })
//       .limit(TREND_WINDOW)
//       .lean();

//     // Reverse so it's oldest -> newest for slope + chart purposes
//     const chronological = readings.reverse();

//     if (chronological.length === 0) {
//       return res.json(emptyTrendResponse());
//     }

//     const values = chronological.map((r) => r.wetnessIndex);
//     const slope = computeSlope(values);
//     const latestIndex = values[values.length - 1];
//     const { trendDirection, suggestion } = deriveSuggestion(slope, latestIndex);

//     res.json({
//       readings: chronological,
//       slope,
//       trendDirection,
//       suggestion: asText(suggestion, "Unable to derive suggestion"),
//       latestLabel: asText(chronological[chronological.length - 1].label, ""),
//     });
//   } catch (err) {
//     console.error("Failed to build trend response:", err);
//     return res.status(500).json({
//       ...emptyTrendResponse("Unable to load trend right now"),
//       error: asText(err?.message, "Unknown trend error"),
//     });
//   }
// });

// // GET /api/history - full history (for a longer chart / audit view)
// // Supports ?limit=N (default 500, capped at 2000) to avoid pulling the
// // entire collection into memory and to avoid the Mongo in-memory sort
// // limit (32MB) on large collections.
// router.get("/history", async (req, res) => {
//   if (mongoose.connection.readyState !== 1) {
//     return res.json([]);
//   }
//   try {
//     const requestedLimit = parseInt(req.query.limit, 10);
//     const limit =
//       Number.isFinite(requestedLimit) && requestedLimit > 0
//         ? Math.min(requestedLimit, 2000)
//         : 500;

//     const readings = await Reading.find()
//       .sort({ timestamp: 1 })
//       .limit(limit)
//       .lean();

//     res.json(readings);
//   } catch (err) {
//     console.error("Failed to load history:", err);
//     res.status(500).json({ error: asText(err?.message, "Failed to load history") });
//   }
// });

// // DELETE /api/trend/history - clears all readings (careful: irreversible).
// // A confirmation token is required in the JSON body so a stray or automated
// // request can't wipe the entire reading history by accident.
// router.delete("/history", async (req, res) => {
//   const expectedToken = process.env.CLEAR_HISTORY_TOKEN || "clear-history";
//   const { token } = (req.body && typeof req.body === "object") ? req.body : {};
//   if (!token || token !== expectedToken) {
//     return res.status(400).json({
//       error: "Confirmation token required — send { token } in the JSON body",
//     });
//   }
//   try {
//     const result = await Reading.deleteMany({});
//     res.json({ deletedCount: result.deletedCount });
//   } catch (err) {
//     res.status(500).json({ error: err.message || "Failed to clear history" });
//   }
// });

// export default router;

import express from "express";
import mongoose from "mongoose";
import Reading from "../models/Reading.js";
import { computeSlope, deriveSuggestion } from "../utils/trend.js";

const router = express.Router();

const TREND_WINDOW = parseInt(process.env.TREND_WINDOW || "10", 10);

function asText(value, fallback = "") {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value && typeof value === "object" && typeof value.message === "string") {
    return value.message;
  }
  return fallback;
}

function emptyTrendResponse(message = "No readings yet — upload an image to get started") {
  return {
    readings: [],
    slope: 0,
    trendDirection: "unknown",
    suggestion: message,
    latestLabel: "",
  };
}

// GET /api/trend - recent readings + computed trend + suggestion
router.get("/", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json(
      emptyTrendResponse("Trend temporarily unavailable: database is reconnecting")
    );
  }

  try {
    const readings = await Reading.find()
      .sort({ timestamp: -1 })
      .limit(TREND_WINDOW)
      .lean();

    // Reverse so it's oldest -> newest for slope + chart purposes
    const chronological = readings.reverse();

    if (chronological.length === 0) {
      return res.json(emptyTrendResponse());
    }

    const values = chronological.map((r) => r.wetnessIndex);
    const slope = computeSlope(values);
    const latestIndex = values[values.length - 1];
    const { trendDirection, suggestion } = deriveSuggestion(slope, latestIndex);

    res.json({
      readings: chronological,
      slope,
      trendDirection,
      suggestion: asText(suggestion, "Unable to derive suggestion"),
      latestLabel: asText(chronological[chronological.length - 1].label, ""),
    });
  } catch (err) {
    console.error("Failed to build trend response:", err);
    return res.status(500).json({
      ...emptyTrendResponse("Unable to load trend right now"),
      error: asText(err?.message, "Unknown trend error"),
    });
  }
});

// GET /api/history - full history (for a longer chart / audit view)
router.get("/history", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json([]);
  }
  try {
    const readings = await Reading.find()
      .sort({ timestamp: -1 })
      .limit(15)
      .lean();
    res.json(readings.reverse());
  } catch (err) {
    console.error("Failed to load history:", err);
    res.status(500).json({ error: asText(err?.message, "Failed to load history") });
  }
});

// DELETE /api/trend/history - clears all readings (careful: irreversible).
// A confirmation token is required in the JSON body so a stray or automated
// request can't wipe the entire reading history by accident.
router.delete("/history", async (req, res) => {
  const expectedToken = process.env.CLEAR_HISTORY_TOKEN || "clear-history";
  const { token } = (req.body && typeof req.body === "object") ? req.body : {};
  if (!token || token !== expectedToken) {
    return res.status(400).json({
      error: "Confirmation token required — send { token } in the JSON body",
    });
  }
  try {
    const result = await Reading.deleteMany({});
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to clear history" });
  }
});

export default router;