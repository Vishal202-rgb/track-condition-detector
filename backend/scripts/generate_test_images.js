import sharp from "sharp";
import fs from "fs";
import path from "path";

const targetDir = path.resolve("../test_images");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function createTrackImage(filename, bgRgb, overlayColor, titleText) {
  const width = 800;
  const height = 500;

  const safeTitle = titleText.replace(/&/g, "&amp;");

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgb(${bgRgb.join(",")})" />
      
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.15 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" opacity="0.4" />

      <path d="M 0 250 Q 200 150 400 250 T 800 250" fill="none" stroke="${overlayColor}" stroke-width="60" opacity="0.6" />

      <rect x="20" y="20" width="340" height="40" rx="8" fill="rgba(0,0,0,0.7)" />
      <text x="35" y="46" font-family="sans-serif" font-size="18" font-weight="bold" fill="#00f0ff">${safeTitle}</text>
    </svg>
  `;

  const filePath = path.join(targetDir, filename);
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toFile(filePath);

  console.log(`Generated test image: ${filePath}`);
}

async function main() {
  await createTrackImage("test_dry_track.jpg", [74, 85, 104], "#334155", "Dry Surface - Sector 1");
  await createTrackImage("test_damp_track.jpg", [45, 55, 72], "#f59e0b", "Damp Track Surface");
  await createTrackImage("test_wet_track.jpg", [26, 32, 44], "#3b82f6", "Wet Track Standing Water");
  await createTrackImage("test_drying_track.jpg", [55, 65, 80], "#fb923c", "Drying Track Line");

  console.log("\nAll sample test images generated in test_images/ directory!");
}

main().catch(console.error);
