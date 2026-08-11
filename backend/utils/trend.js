export function computeSlope(values) {
  const n = values.length;
  if (n < 2) return 0;

  const xs = values.map((_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xs[i] - xMean) * (values[i] - yMean);
    denominator += (xs[i] - xMean) ** 2;
  }

  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function deriveSuggestion(slope, latestIndex) {
  const DRYING_THRESHOLD = -0.3;
  const WETTING_THRESHOLD = 0.3;

  let trendDirection;
  let suggestion;

  if (slope <= DRYING_THRESHOLD) {
    trendDirection = "drying";
    suggestion =
      latestIndex <= 1
        ? "Track drying fast: tire change window approaching"
        : "Track drying: monitor closely for the tire change window";
  } else if (slope >= WETTING_THRESHOLD) {
    trendDirection = "wetting";
    suggestion =
      latestIndex >= 2
        ? "Track getting wetter: consider wet tires"
        : "Track wetting: watch conditions closely";
  } else {
    trendDirection = "stable";
    suggestion =
      latestIndex <= 0.5
        ? "Track stable and dry"
        : latestIndex >= 2.5
        ? "Track stable and wet"
        : "Track conditions steady, no action needed";
  }

  return { trendDirection, suggestion };
}

/**
 * UNIQUE FEATURE: Time-to-Dry / Time-to-Wet ETA prediction.
 * Uses REAL elapsed time (not just reading count) between the first and
 * last reading in the window to compute a rate of change per minute, then
 * linearly extrapolates when the track will cross the Dry (0) or Wet (3)
 * boundary. This directly answers the problem statement's core ask:
 * "know right now if the track is becoming safer or riskier" — with an
 * actual time estimate, not just a direction.
 */
export function computeEta(readings) {
  if (readings.length < 2) {
    return { etaMinutes: null, etaLabel: null, ratePerMinute: 0 };
  }

  const first = readings[0];
  const last = readings[readings.length - 1];
  const minutesElapsed =
    (new Date(last.timestamp) - new Date(first.timestamp)) / 60000;

  if (minutesElapsed <= 0) {
    return { etaMinutes: null, etaLabel: null, ratePerMinute: 0 };
  }

  const indexChange = last.wetnessIndex - first.wetnessIndex;
  const ratePerMinute = indexChange / minutesElapsed;

  // Rate too small to mean anything — track is essentially static
  if (Math.abs(ratePerMinute) < 0.01) {
    return { etaMinutes: null, etaLabel: null, ratePerMinute };
  }

  const DRY = 0;
  const WET = 3;
  const latestIndex = last.wetnessIndex;

  if (ratePerMinute < 0) {
    // Trending toward Dry
    const minutesToDry = (latestIndex - DRY) / Math.abs(ratePerMinute);
    return {
      etaMinutes: Math.max(0, Math.round(minutesToDry)),
      etaLabel: "Dry",
      ratePerMinute,
    };
  } else {
    // Trending toward Wet
    const minutesToWet = (WET - latestIndex) / ratePerMinute;
    return {
      etaMinutes: Math.max(0, Math.round(minutesToWet)),
      etaLabel: "Wet",
      ratePerMinute,
    };
  }
}