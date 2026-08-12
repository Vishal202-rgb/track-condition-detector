import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { classifyTrackImage, getBufferMd5, heuristicClassify } from "./services/classifier";
import { fetchLiveWeather, resetWeatherCache } from "./services/weather";
import { computeSlope, recommendTireStrategy } from "./services/trend";

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  resetWeatherCache();
});

describe("trend engine", () => {
  it("computes a least-squares slope for a drying track", () => {
    expect(computeSlope([{ x: 1, y: 50 }, { x: 2, y: 40 }, { x: 3, y: 30 }])).toBe(-10);
    expect(computeSlope([{ x: 1, y: 50 }])).toBe(0);
  });

  it("maps saturation and slope to the exact tire labels", () => {
    expect(recommendTireStrategy(12, -0.5).tireStrategy).toBe("Slicks");
    expect(recommendTireStrategy(52, 1.4).tireStrategy).toBe("Intermediates");
    expect(recommendTireStrategy(84, 3.1).tireStrategy).toBe("Full Wets");
  });
});

describe("classifier fallback", () => {
  it("produces a bounded moisture result and stable MD5 hash", () => {
    const buffer = Buffer.alloc(128, 70);
    const result = heuristicClassify(buffer);
    expect(result.condition).toBe("Wet");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(getBufferMd5(buffer)).toBe(getBufferMd5(Buffer.from(buffer)));
  });

  it("rejects an empty image payload before producing a misleading result", () => {
    expect(() => heuristicClassify(Buffer.alloc(0))).toThrow("empty image buffer");
  });

  it("returns the cached heuristic result for repeated buffers when Claude is unavailable", async () => {
    const buffer = Buffer.alloc(128, 170);
    const first = await classifyTrackImage(buffer);
    const second = await classifyTrackImage(buffer);
    expect(first.condition).toBe("Dry");
    expect(second.source).toBe("cache");
  });
});

describe("Open-Meteo weather helper", () => {
  it("parses current weather into dashboard-ready values", async () => {
    vi.spyOn(axios, "get").mockResolvedValue({ data: { current: { temperature_2m: 22, relative_humidity_2m: 61, wind_speed_10m: 14 } } } as never);
    await expect(fetchLiveWeather()).resolves.toEqual({ temp: "22°C", humidity: "61%", windSpeed: "14 km/h" });
  });

  it("serves the last successful Open-Meteo snapshot during a transient outage", async () => {
    const request = vi.spyOn(axios, "get");
    request.mockResolvedValueOnce({ data: { current: { temperature_2m: 20, relative_humidity_2m: 60, wind_speed_10m: 11 } } } as never);
    await expect(fetchLiveWeather()).resolves.toEqual({ temp: "20°C", humidity: "60%", windSpeed: "11 km/h" });
    request.mockRejectedValueOnce(new Error("provider unavailable"));
    await expect(fetchLiveWeather()).resolves.toEqual({ temp: "20°C", humidity: "60%", windSpeed: "11 km/h" });
  });

  it("reports unavailable weather instead of inventing fallback observations", async () => {
    vi.spyOn(axios, "get").mockRejectedValue(new Error("provider unavailable"));
    await expect(fetchLiveWeather()).resolves.toEqual({ temp: "N/A", humidity: "N/A", windSpeed: "N/A" });
  });
});
