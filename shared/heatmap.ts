export type HeatCondition = "Dry" | "Damp" | "Wet" | "Drying";

export function getHeatmapColor(condition: string, saturation: number): string {
  if (condition === "Wet" || saturation >= 70) return "#ff5e72";
  if (condition === "Damp" || saturation >= 38) return "#ffb14a";
  if (condition === "Drying") return "#57e9ff";
  return "#b7ff39";
}

export function getHeatmapBand(saturation: number): "LOW" | "ELEVATED" | "HIGH" {
  if (saturation >= 70) return "HIGH";
  if (saturation >= 38) return "ELEVATED";
  return "LOW";
}
