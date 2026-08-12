import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { createAuditLog, createTelemetryReading, getAllTelemetryReadings, getTelemetryReadings } from "../db";
import { classifyTrackImage } from "../services/classifier";
import { fetchLiveWeather } from "../services/weather";
import { computeSlope, recommendTireStrategy } from "../services/trend";
import { storagePut } from "../storage";
import { randomUUID } from "node:crypto";

export const SECTORS = [
  "Sector 1 (Turn 1–4)",
  "Sector 2 (Chicane)",
  "Sector 3 (Straight)",
  "Pit Lane",
] as const;

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const analysisInput = z.object({
  imageBase64: z.string().min(16).max(12_000_000),
  mimeType: z.enum(IMAGE_MIME_TYPES).default("image/jpeg"),
  sectorId: z.enum(SECTORS),
  weather: z.object({ temp: z.string(), humidity: z.string(), windSpeed: z.string() }).optional(),
});

function decodeDataUrl(input: string) {
  const match = input.match(/^data:([^;]+);base64,([\s\S]+)$/);
  const buffer = Buffer.from(match?.[2] ?? input, "base64");
  if (buffer.length === 0 || buffer.length > 8_000_000) throw new Error("Image payload must be between 1 byte and 8 MB");
  return { mimeType: match?.[1] ?? "image/jpeg", buffer };
}

function buildTrend(readings: Array<{ saturation: number; createdAt: Date }>) {
  const points = readings.slice().reverse().map((reading, index) => ({ x: index + 1, y: reading.saturation }));
  const slope = computeSlope(points);
  const latest = readings[0];
  const strategy = recommendTireStrategy(latest?.saturation ?? 25, slope);
  return { slope, ...strategy, points };
}

export const telemetryRouter = router({
  sectors: publicProcedure.query(() => SECTORS.map((id, index) => ({ id, index: index + 1, shortName: id.replace("Sector ", "S").replace(" (Turn 1–4)", "").replace(" (Chicane)", "").replace(" (Straight)", "") }))),
  weather: publicProcedure.query(() => fetchLiveWeather()),

  analyze: protectedProcedure.input(analysisInput).mutation(async ({ ctx, input }) => {
    const { buffer, mimeType } = decodeDataUrl(input.imageBase64);
    const result = await classifyTrackImage(buffer, mimeType);
    const weather = input.weather ?? await fetchLiveWeather();
    let imageUrl: string | undefined;
    try {
      const extension = mimeType.split("/")[1] ?? "jpg";
      const upload = await storagePut(`${ctx.user.id}-track-images/${Date.now()}-${randomUUID()}.${extension}`, buffer, mimeType);
      imageUrl = upload.url;
    } catch (error) {
      console.warn("[Telemetry] Storage upload skipped:", error);
    }

    const prior = await getTelemetryReadings(ctx.user.id, input.sectorId);
    const trend = buildTrend([{ saturation: result.saturation, createdAt: new Date() }, ...prior]);
    const reading = await createTelemetryReading({
      userId: ctx.user.id,
      sectorId: input.sectorId,
      condition: result.condition,
      confidence: result.confidence,
      saturation: result.saturation,
      tireStrategy: trend.tireStrategy,
      pitWindowLap: trend.pitWindowLap,
      slope: trend.slopeDesc,
      temp: weather.temp,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      imageUrl,
      source: result.source,
    });

    try {
      await createAuditLog({ userId: ctx.user.id, action: "track_analysis", entity: "telemetry_reading", message: `Classified ${input.sectorId} as ${result.condition}`, metadata: JSON.stringify({ sectorId: input.sectorId, confidence: result.confidence, saturation: result.saturation, source: result.source }) });
    } catch (error) {
      console.warn("[Telemetry] Audit log write skipped:", error);
    }
    return { reading, result, weather, trend, confidenceFlag: result.confidence < 75 };
  }),

  trend: protectedProcedure.input(z.object({ sectorId: z.enum(SECTORS) })).query(async ({ ctx, input }) => {
    const readings = await getTelemetryReadings(ctx.user.id, input.sectorId);
    const latest = readings[0];
    return {
      sectorId: input.sectorId,
      readings,
      trend: buildTrend(readings),
      latest,
    };
  }),

  history: protectedProcedure.query(async ({ ctx }) => getAllTelemetryReadings(ctx.user.id)),

  exportCsv: protectedProcedure.query(async ({ ctx }) => {
    const readings = await getAllTelemetryReadings(ctx.user.id, 10_000);
    const header = "id,sectorId,condition,confidence,saturation,tireStrategy,pitWindowLap,slope,temp,humidity,windSpeed,source,createdAt";
    const lines = readings.map((r) => [r.id, r.sectorId, r.condition, r.confidence, r.saturation, r.tireStrategy, r.pitWindowLap, r.slope, r.temp ?? "", r.humidity ?? "", r.windSpeed ?? "", r.source, r.createdAt.toISOString()].map(value => `"${String(value).replaceAll('"', '""')}"`).join(","));
    return [header, ...lines].join("\n");
  }),

  simulate: publicProcedure.input(z.object({ scenario: z.enum(["dry race", "safety car wet", "drying track"]) })).query(({ input }) => {
    const profiles = {
      "dry race": [12, 11, 10, 9],
      "safety car wet": [78, 82, 86, 88],
      "drying track": [68, 57, 45, 32],
    } as const;
    const saturations = profiles[input.scenario];
    return saturations.map((saturation, index) => {
      const slope = index === 0 ? 0 : Number((saturation - saturations[index - 1]).toFixed(1));
      return { lap: index + 1, saturation, ...recommendTireStrategy(saturation, slope) };
    });
  }),
});
