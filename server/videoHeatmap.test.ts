import { describe, expect, it } from "vitest";
import { getHeatmapBand, getHeatmapColor } from "../shared/heatmap";
import { MAX_VIDEO_SAMPLES, createSampleTimes, validateVideoCandidate } from "../shared/videoSampling";

describe("short-video frame sampling", () => {
  it("creates evenly spaced samples and never exceeds the four-frame work bound", () => {
    expect(createSampleTimes(20)).toEqual([4, 8, 12, 16]);
    expect(createSampleTimes(7)).toEqual([2.33, 4.67]);
    expect(createSampleTimes(0)).toEqual([]);
    expect(createSampleTimes(Number.NaN)).toEqual([]);
    expect(createSampleTimes(20)).toHaveLength(MAX_VIDEO_SAMPLES);
  });

  it("rejects empty, oversized, and overlong clips before frame extraction", () => {
    expect(validateVideoCandidate(0, 5)).toContain("empty");
    expect(validateVideoCandidate(25 * 1024 * 1024 + 1, 5)).toContain("25 MB");
    expect(validateVideoCandidate(1024, 20.1)).toContain("20 seconds");
    expect(validateVideoCandidate(1024, 5)).toBeNull();
  });
});

describe("circuit moisture heatmap", () => {
  it("uses consistent safety-priority color bands", () => {
    expect(getHeatmapColor("Wet", 15)).toBe("#ff5e72");
    expect(getHeatmapColor("Dry", 72)).toBe("#ff5e72");
    expect(getHeatmapColor("Damp", 20)).toBe("#ffb14a");
    expect(getHeatmapColor("Drying", 56)).toBe("#ffb14a");
    expect(getHeatmapColor("Drying", 24)).toBe("#57e9ff");
    expect(getHeatmapColor("Dry", 24)).toBe("#b7ff39");
  });

  it("maps saturation into readable moisture bands", () => {
    expect(getHeatmapBand(0)).toBe("LOW");
    expect(getHeatmapBand(38)).toBe("ELEVATED");
    expect(getHeatmapBand(70)).toBe("HIGH");
  });
});
