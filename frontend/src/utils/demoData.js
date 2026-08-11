// High-contrast sample track canvas SVG generator for instant demo testing
export function generateSampleTrackImage(type = "dry") {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");

  // Track Asphalt background
  ctx.fillStyle = type === "wet" ? "#1a202c" : type === "damp" || type === "drying" ? "#2d3748" : "#4a5568";
  ctx.fillRect(0, 0, 600, 400);

  // Grain texture
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 600;
    const y = Math.random() * 400;
    const size = Math.random() * 2 + 1;
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.3)";
    ctx.fillRect(x, y, size, size);
  }

  // Kerb stripes (Red & White)
  const kerbColors = ["#ef4444", "#ffffff"];
  for (let i = 0; i < 600; i += 40) {
    ctx.fillStyle = kerbColors[(i / 40) % 2];
    ctx.fillRect(i, 360, 40, 40);
  }

  // Water reflections / sheen for wet/damp/drying
  if (type === "wet" || type === "damp" || type === "drying") {
    const numPuddles = type === "wet" ? 8 : type === "damp" ? 4 : 2;
    for (let i = 0; i < numPuddles; i++) {
      const px = Math.random() * 500 + 50;
      const py = Math.random() * 250 + 50;
      const rx = Math.random() * 80 + 40;
      const ry = Math.random() * 40 + 20;

      const grad = ctx.createRadialGradient(px, py, 2, px, py, rx);
      if (type === "wet") {
        grad.addColorStop(0, "rgba(0, 240, 255, 0.45)");
        grad.addColorStop(0.7, "rgba(59, 130, 246, 0.25)");
        grad.addColorStop(1, "transparent");
      } else {
        grad.addColorStop(0, "rgba(245, 158, 11, 0.3)");
        grad.addColorStop(1, "transparent");
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, Math.PI / 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Racing line
  ctx.strokeStyle = type === "dry" ? "rgba(20,20,20,0.6)" : "rgba(0, 240, 255, 0.2)";
  ctx.lineWidth = 45;
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.bezierCurveTo(200, 100, 400, 300, 600, 200);
  ctx.stroke();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], `sample_${type}_track.jpg`, { type: "image/jpeg" });
      resolve(file);
    }, "image/jpeg");
  });
}

export const DEMO_PRESETS = [
  { id: "dry", label: "Dry Asphalt (Slicks)", desc: "Optimal grip, 0% water saturation", icon: "☀️", temp: "34°C Track" },
  { id: "drying", label: "Drying Racing Line", desc: "Moisture evaporating, dry line forming", icon: "⛅", temp: "29°C Track" },
  { id: "damp", label: "Damp Surface (Intermediate)", desc: "Light moisture, slick threshold", icon: "🌦️", temp: "22°C Track" },
  { id: "wet", label: "Standing Water (Wets)", desc: "Aquaplaning risk, heavy surface water", icon: "🌧️", temp: "18°C Track" },
];
