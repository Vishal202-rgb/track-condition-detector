/**
 * Maps the current wetness reading + trend direction into a simple,
 * decision-oriented risk level. This directly answers the problem
 * statement's framing: "so they can decide when to change tires" —
 * not just a label, but a risk category a team can act on immediately.
 */
export function deriveRiskLevel(wetnessIndex, trendDirection) {
  let level;
  let reason;

  if (wetnessIndex >= 2.5) {
    level = "Danger";
    reason = "Track is wet — high risk of reduced grip";
  } else if (wetnessIndex >= 1.5 || trendDirection === "wetting") {
    level = "Caution";
    reason =
      trendDirection === "wetting"
        ? "Track is trending wetter — monitor closely"
        : "Track is damp — grip may be inconsistent";
  } else {
    level = "Safe";
    reason = "Track conditions are stable and dry";
  }

  return { level, reason };
}