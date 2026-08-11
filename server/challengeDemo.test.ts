import { describe, expect, it } from "vitest";
import { challengeDemoSteps, getDecisionEvidence, getRaceControlAlert } from "../shared/challengeDemo";

describe("challenge demo sequence", () => {
  it("covers the four required conditions in a clear wet-to-dry progression", () => {
    expect(challengeDemoSteps).toHaveLength(4);
    expect(challengeDemoSteps.map((step) => step.condition)).toEqual(["Wet", "Damp", "Drying", "Dry"]);
    expect(challengeDemoSteps.map((step) => step.saturation)).toEqual([84, 54, 33, 12]);
  });

  it("produces actionable race-control language for wet and drying conditions", () => {
    const wetAlert = getRaceControlAlert(challengeDemoSteps[0]);
    const dryingAlert = getRaceControlAlert(challengeDemoSteps[2]);

    expect(wetAlert).toMatchObject({ tone: "critical", label: "ACTION NOW", title: "WET-SURFACE RISK" });
    expect(wetAlert.message).toContain("Full Wets");
    expect(dryingAlert).toMatchObject({ tone: "approaching", label: "WINDOW APPROACHING", title: "SLICK CROSSOVER WATCH" });
    expect(dryingAlert.message).toContain("Track drying: tire change window approaching");
    expect(dryingAlert.message).toContain("Slicks");
  });

  it("provides condition-specific evidence and falls back safely for an unknown label", () => {
    expect(getDecisionEvidence("Wet").cues).toContain("High saturation");
    expect(getDecisionEvidence("Drying").cues).toContain("Slick crossover approaching");
    expect(getDecisionEvidence("Unknown").summary).toBe(getDecisionEvidence("Damp").summary);
  });
});
