import sharp from "sharp";

export async function classifyWithHeuristic(imageBuffer) {
  const { data } = await sharp(imageBuffer)
    .resize(200, 200, { fit: "inside" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Array.from(data);
  const n = pixels.length;

  const mean = pixels.reduce((sum, v) => sum + v, 0) / n;
  const variance = pixels.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  const maxVal = Math.max(...pixels);
  const brightPixelRatio = pixels.filter((v) => v > 220).length / n;

  let label;
  let reasoning;
  let signalStrength; // how strongly the image matches this label, 0-1

  if (brightPixelRatio > 0.03 && maxVal > 240) {
    label = "Wet";
    reasoning = "Bright specular highlights suggest standing water";
    signalStrength = Math.min(brightPixelRatio * 10, 1);
  } else if (stdDev > 45) {
    label = "Drying";
    reasoning = "High brightness variance suggests patchy drying surface";
    signalStrength = Math.min((stdDev - 45) / 40, 1);
  } else if (mean < 100 && stdDev > 25) {
    label = "Damp";
    reasoning = "Darker, moderately uneven surface without bright highlights";
    signalStrength = Math.min((stdDev - 25) / 30, 1);
  } else {
    label = "Dry";
    reasoning = "Uniform brightness with no reflections detected";
    signalStrength = Math.min((40 - stdDev) / 40, 1);
  }

  // Confidence now actually varies per image: base 0.4 + up to 0.4 more
  // depending on how strong the matched signal is. Never hits 100% since
  // this is a crude heuristic, not the real AI model.
  const confidence = Math.round((0.4 + Math.max(0, signalStrength) * 0.4) * 100) / 100;

  return { label, confidence, reasoning };
}