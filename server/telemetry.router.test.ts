import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  createAuditLog: vi.fn(),
  createTelemetryReading: vi.fn(),
  getAllTelemetryReadings: vi.fn(),
  getTelemetryReadings: vi.fn(),
}));

vi.mock("./services/classifier", () => ({
  classifyTrackImage: vi.fn(),
}));

vi.mock("./services/weather", () => ({
  fetchLiveWeather: vi.fn(),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

import { createAuditLog, createTelemetryReading, getAllTelemetryReadings, getTelemetryReadings } from "./db";
import { telemetryRouter } from "./routers/telemetry";
import { classifyTrackImage } from "./services/classifier";
import { fetchLiveWeather } from "./services/weather";
import { storagePut } from "./storage";

const publicContext = {
  user: null,
  req: { protocol: "https", headers: {} },
  res: { clearCookie: vi.fn() },
} as any;

const weather = { temp: "18°C", humidity: "70%", windSpeed: "10 km/h" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getTelemetryReadings).mockResolvedValue([] as never);
  vi.mocked(getAllTelemetryReadings).mockResolvedValue([] as never);
  vi.mocked(createTelemetryReading).mockResolvedValue({ id: "101" } as never);
  vi.mocked(createAuditLog).mockResolvedValue(undefined);
  vi.mocked(storagePut).mockResolvedValue({ key: "public-track-images/reading.jpg", url: "https://example.test/reading.jpg" } as never);
  vi.mocked(classifyTrackImage).mockResolvedValue({ condition: "Damp", confidence: 72, saturation: 48, source: "heuristic-fallback" });
  vi.mocked(fetchLiveWeather).mockResolvedValue(weather);
});

describe("public telemetry workflows", () => {
  it("analyzes a supported image, persists a unique public asset, and returns a confidence flag", async () => {
    const caller = telemetryRouter.createCaller(publicContext);

    const result = await caller.analyze({
      imageBase64: "data:image/jpeg;base64,AAECAwQFBgcICQoLDA0ODw==",
      mimeType: "image/jpeg",
      sectorId: "Sector 2 (Chicane)",
      weather,
    });

    expect(classifyTrackImage).toHaveBeenCalledOnce();
    expect(storagePut).toHaveBeenCalledWith(expect.stringMatching(/^public-track-images\/\d+-[a-f0-9-]+\.jpeg$/), expect.any(Buffer), "image/jpeg");
    expect(createTelemetryReading).toHaveBeenCalledWith(expect.objectContaining({
      sectorId: "Sector 2 (Chicane)",
      condition: "Damp",
      saturation: 48,
      tireStrategy: "Intermediates",
      imageUrl: "https://example.test/reading.jpg",
    }));
    expect(createAuditLog).toHaveBeenCalledOnce();
    expect(result.confidenceFlag).toBe(true);
  });

  it("exports public history as safely quoted CSV and bounds display history", async () => {
    const createdAt = new Date("2026-08-11T22:00:00.000Z");
    vi.mocked(getAllTelemetryReadings).mockResolvedValue([{
      id: "10",
      sectorId: "Pit Lane",
      condition: "Wet",
      confidence: 86,
      saturation: 83,
      tireStrategy: "Full Wets",
      pitWindowLap: 1,
      slope: "Wetting (+4/lap)",
      temp: "18°C",
      humidity: "70%",
      windSpeed: "10 km/h",
      source: "claude-api",
      createdAt,
    }] as never);
    const caller = telemetryRouter.createCaller(publicContext);

    const [history, csv] = await Promise.all([caller.history(), caller.exportCsv()]);

    expect(history).toHaveLength(1);
    expect(csv).toContain('"Pit Lane"');
    expect(csv).toContain(createdAt.toISOString());
    expect(getAllTelemetryReadings).toHaveBeenCalledWith();
    expect(getAllTelemetryReadings).toHaveBeenCalledWith(10_000);
  });

  it("keeps every simulator scenario to exactly four laps and allows anonymous history access", async () => {
    const caller = telemetryRouter.createCaller(publicContext);
    const scenarios = ["dry race", "safety car wet", "drying track"] as const;
    for (const scenario of scenarios) {
      await expect(caller.simulate({ scenario })).resolves.toHaveLength(4);
    }
    await expect(caller.history()).resolves.toEqual([]);
  });
});
