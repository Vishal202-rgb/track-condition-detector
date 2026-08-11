import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../_core/env";

const MAX_CACHE_ENTRIES = 500;
const md5Cache = new Map<string, { condition: string; confidence: number; saturation: number }>();

function setCachedResult(hash: string, result: { condition: string; confidence: number; saturation: number }) {
  if (!md5Cache.has(hash) && md5Cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = md5Cache.keys().next().value;
    if (oldestKey) md5Cache.delete(oldestKey);
  }
  md5Cache.set(hash, result);
}

export function getBufferMd5(buffer: Buffer): string {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

export function heuristicClassify(buffer: Buffer): { condition: string; confidence: number; saturation: number } {
  if (buffer.length === 0) throw new Error("Cannot classify an empty image buffer");
  let sum = 0;
  for (let i = 0; i < Math.min(buffer.length, 2048); i++) {
    sum += buffer[i];
  }
  const avg = sum / Math.min(buffer.length, 2048);
  if (avg < 80) {
    return { condition: "Wet", confidence: 88, saturation: 85 };
  } else if (avg < 120) {
    return { condition: "Damp", confidence: 82, saturation: 55 };
  } else if (avg < 150) {
    return { condition: "Drying", confidence: 79, saturation: 35 };
  } else {
    return { condition: "Dry", confidence: 92, saturation: 10 };
  }
}

export async function classifyTrackImage(buffer: Buffer, mimeType: string = "image/jpeg"): Promise<{ condition: string; confidence: number; saturation: number; source: string }> {
  const hash = getBufferMd5(buffer);
  if (md5Cache.has(hash)) {
    const cached = md5Cache.get(hash)!;
    return { ...cached, source: "cache" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || (ENV as any).ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const anthropic = new Anthropic({ apiKey });
      const base64Image = buffer.toString("base64");
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: "Analyze this racetrack surface image. Return strictly valid JSON with keys: condition (must be exactly one of: 'Dry', 'Damp', 'Wet', 'Drying'), confidence (integer 0 to 100), and saturation (integer 0 to 100 moisture saturation). Do not include markdown codeblocks or extra text.",
              },
            ],
          },
        ],
      });

      const textBlock = response.content.find((c: { type: string }) => c.type === "text");
      if (textBlock && 'text' in textBlock) {
        const cleaned = (textBlock as any).text.trim().replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.condition && typeof parsed.confidence === "number" && typeof parsed.saturation === "number") {
          const result = {
            condition: ["Dry", "Damp", "Wet", "Drying"].includes(parsed.condition) ? parsed.condition : "Dry",
            confidence: Math.round(Math.min(100, Math.max(0, parsed.confidence))),
            saturation: Math.round(Math.min(100, Math.max(0, parsed.saturation))),
          };
          setCachedResult(hash, result);
          return { ...result, source: "claude-api" };
        }
      }
    } catch (e) {
      console.warn("[Classifier] Claude API classification failed, falling back to heuristic:", e);
    }
  }

  const heuristic = heuristicClassify(buffer);
  setCachedResult(hash, heuristic);
  return { ...heuristic, source: "heuristic-fallback" };
}
