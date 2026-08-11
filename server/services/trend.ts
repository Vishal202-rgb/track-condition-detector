export function computeSlope(points: { x: number; y: number }[]): number {
  if (points.length < 2) return 0;
  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const pt of points) {
    sumX += pt.x;
    sumY += pt.y;
    sumXY += pt.x * pt.y;
    sumXX += pt.x * pt.x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;
  const slope = (n * sumXY - sumX * sumY) / denominator;
  return Number(slope.toFixed(3));
}

export function recommendTireStrategy(saturation: number, slope: number): { tireStrategy: string; pitWindowLap: number; slopeDesc: string } {
  let tireStrategy = "Slicks";
  let pitWindowLap = 12;

  if (saturation >= 70) {
    tireStrategy = "Full Wets";
    pitWindowLap = slope < 0 ? 3 : 1;
  } else if (saturation >= 40) {
    tireStrategy = "Intermediates";
    pitWindowLap = slope < 0 ? 5 : 2;
  } else {
    tireStrategy = "Slicks";
    pitWindowLap = slope > 0 ? 8 : 15;
  }

  const slopeDesc = slope > 0 ? `Wetting (+${slope}/lap)` : slope < 0 ? `Drying (${slope}/lap)` : `Stable`;
  return { tireStrategy, pitWindowLap, slopeDesc };
}
