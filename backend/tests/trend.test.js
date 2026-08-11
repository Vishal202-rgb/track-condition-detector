import { test, describe } from "node:test";
import assert from "node:assert";
import { computeSlope, deriveSuggestion } from "../utils/trend.js";

describe("Trend Engine Math & Logic Tests", () => {
  test("computeSlope returns 0 for less than 2 readings", () => {
    assert.strictEqual(computeSlope([]), 0);
    assert.strictEqual(computeSlope([2]), 0);
  });

  test("computeSlope calculates correct negative slope for drying track", () => {
    // Wet (3) -> Damp (2) -> Drying (1) -> Dry (0)
    const values = [3, 2, 1, 0];
    const slope = computeSlope(values);
    assert.strictEqual(slope, -1);
  });

  test("computeSlope calculates correct positive slope for wetting track", () => {
    // Dry (0) -> Drying (1) -> Damp (2) -> Wet (3)
    const values = [0, 1, 2, 3];
    const slope = computeSlope(values);
    assert.strictEqual(slope, 1);
  });

  test("computeSlope returns 0 for flat stable conditions", () => {
    const values = [2, 2, 2, 2];
    const slope = computeSlope(values);
    assert.strictEqual(slope, 0);
  });

  test("deriveSuggestion returns drying direction and tire advice", () => {
    const { trendDirection, suggestion } = deriveSuggestion(-0.5, 1);
    assert.strictEqual(trendDirection, "drying");
    assert.ok(suggestion.includes("drying"));
  });

  test("deriveSuggestion returns wetting direction and wet tire advice", () => {
    const { trendDirection, suggestion } = deriveSuggestion(0.6, 3);
    assert.strictEqual(trendDirection, "wetting");
    assert.ok(suggestion.includes("wet tires"));
  });

  test("deriveSuggestion returns stable direction when slope is near zero", () => {
    const { trendDirection, suggestion } = deriveSuggestion(0.05, 0);
    assert.strictEqual(trendDirection, "stable");
    assert.strictEqual(suggestion, "Track stable and dry");
  });
});
