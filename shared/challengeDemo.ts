export const challengeConditions = ["Dry", "Damp", "Wet", "Drying"] as const;
export type ChallengeCondition = (typeof challengeConditions)[number];

export type ChallengeDemoStep = {
  condition: ChallengeCondition;
  saturation: number;
  confidence: number;
  tireStrategy: "Slicks" | "Intermediates" | "Full Wets";
  pitWindowLap: number;
  slope: string;
  headline: string;
};

/** A clearly labelled demo sequence that mirrors the hackathon's required condition vocabulary. */
export const challengeDemoSteps: readonly ChallengeDemoStep[] = [
  { condition: "Wet", saturation: 84, confidence: 94, tireStrategy: "Full Wets", pitWindowLap: 1, slope: "Wetting (+4.1/lap)", headline: "Track becoming riskier — pit this lap for Full Wets." },
  { condition: "Damp", saturation: 54, confidence: 86, tireStrategy: "Intermediates", pitWindowLap: 3, slope: "Drying (-1.8/lap)", headline: "Patchy grip remains — hold Intermediates while the dry line forms." },
  { condition: "Drying", saturation: 33, confidence: 89, tireStrategy: "Intermediates", pitWindowLap: 2, slope: "Drying (-3.2/lap)", headline: "Track drying: tire change window approaching. Consider Slicks in ~2 laps." },
  { condition: "Dry", saturation: 12, confidence: 96, tireStrategy: "Slicks", pitWindowLap: 14, slope: "Drying (-0.6/lap)", headline: "Dry line established — Slicks are now the optimal compound." },
];

type Evidence = { summary: string; cues: readonly string[] };

const evidenceByCondition: Record<ChallengeCondition, Evidence> = {
  Dry: { summary: "Low saturation and a stable surface trend support a dry-line call.", cues: ["Low surface saturation", "Consistent dry-line trend", "No wet-risk escalation"] },
  Damp: { summary: "Mixed moisture cues indicate variable grip and a transitional tyre window.", cues: ["Patchy moisture", "Variable grip risk", "Intermediate crossover zone"] },
  Wet: { summary: "High saturation and a rising moisture trend indicate immediate wet-surface risk.", cues: ["High saturation", "Wetting trend", "Full-wet safety margin"] },
  Drying: { summary: "Falling saturation indicates that the dry line is developing across the active sector.", cues: ["Falling moisture score", "Negative moisture slope", "Slick crossover approaching"] },
};

export function getDecisionEvidence(condition: string): Evidence {
  return evidenceByCondition[condition as ChallengeCondition] ?? evidenceByCondition.Damp;
}

export function getRaceControlAlert(input: Pick<ChallengeDemoStep, "condition" | "tireStrategy" | "pitWindowLap" | "slope">) {
  if (input.condition === "Wet") {
    return { tone: "critical", label: "ACTION NOW", title: "WET-SURFACE RISK", message: `Track becoming riskier. Consider ${input.tireStrategy} this lap; predicted pit window: Lap ${input.pitWindowLap}.` } as const;
  }
  if (input.condition === "Drying") {
    return { tone: "approaching", label: "WINDOW APPROACHING", title: "SLICK CROSSOVER WATCH", message: `Track drying: tire change window approaching. Consider ${input.tireStrategy === "Intermediates" ? "Slicks" : input.tireStrategy} in approximately ${input.pitWindowLap} laps.` } as const;
  }
  if (input.condition === "Dry") {
    return { tone: "stable", label: "TRACK STABLE", title: "DRY LINE CONFIRMED", message: `Maintain ${input.tireStrategy}; the current trend is ${input.slope}.` } as const;
  }
  return { tone: "monitor", label: "MONITOR", title: "VARIABLE GRIP", message: `Maintain ${input.tireStrategy} while monitoring sector evolution. Review the next ${input.pitWindowLap} laps before committing.` } as const;
}
