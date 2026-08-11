import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `You are a racetrack surface analyst. You look at a single photo of a
race track surface and classify its condition. Use these visual cues:

- Wet: standing water, puddles, strong specular reflections, glossy uniform sheen
- Damp: dark patchy sheen, no standing water, surface looks recently wet but not glossy
- Drying: streaky patterns, mix of dry and wet patches, uneven color, visible drying edges
- Dry: matte, uniform surface color, no reflections or dark patches

Respond with ONLY a JSON object, no other text, no markdown fences:
{"label": "Dry" | "Damp" | "Wet" | "Drying", "confidence": 0.0-1.0, "reasoning": "one short sentence"}`;

// In-memory response cache for API rate-limiting & speed
const classificationCache = new Map();

/**
 * Classify a track image using Claude's vision capability.
 * @param {Buffer} imageBuffer - raw image bytes
 * @param {string} mediaType - e.g. "image/jpeg", "image/png"
 * @returns {Promise<{label: string, confidence: number, reasoning: string}>}
 */
export async function classifyWithAI(imageBuffer, mediaType) {
  const hash = crypto.createHash("md5").update(imageBuffer).digest("hex");
  if (classificationCache.has(hash)) {
    console.log(`[Cache Hit] Returning cached AI result for image hash ${hash.substring(0, 8)}`);
    return classificationCache.get(hash);
  }

  const base64Image = imageBuffer.toString("base64");

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: "Classify this track surface image.",
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("No text response from classification model");
  }

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  if (!["Dry", "Damp", "Wet", "Drying"].includes(parsed.label)) {
    throw new Error(`Unexpected label from model: ${parsed.label}`);
  }

  classificationCache.set(hash, parsed);
  return parsed;
}
