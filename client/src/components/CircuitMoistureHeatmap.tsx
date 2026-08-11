import { getHeatmapBand, getHeatmapColor } from "@shared/heatmap";

type HeatmapReading = {
  sectorId: string;
  condition: string;
  saturation: number;
};

const segments = [
  { sectorId: "Sector 1 (Turn 1–4)", path: "M56 112 C79 45 190 8 294 41 C334 55 359 89 356 126", x: 168, y: 46 },
  { sectorId: "Sector 2 (Chicane)", path: "M356 126 C388 166 379 212 340 244 C307 270 249 252 207 221", x: 348, y: 190 },
  { sectorId: "Sector 3 (Straight)", path: "M207 221 C164 191 119 193 84 225 C56 257 76 303 123 318", x: 120, y: 289 },
  { sectorId: "Pit Lane", path: "M123 318 C172 335 221 311 248 281 L302 306", x: 266, y: 306 },
];

export function CircuitMoistureHeatmap({ readings, activeSector, onSelect }: { readings: HeatmapReading[]; activeSector: string; onSelect: (sector: any) => void }) {
  const readingFor = (sectorId: string) => readings.find((reading) => reading.sectorId === sectorId) ?? { sectorId, condition: "Dry", saturation: 0 };
  return <section className="circuit-heatmap" aria-label="Circuit moisture heatmap">
    <div className="heatmap-heading"><div><p className="eyebrow">LIVE CIRCUIT OVERLAY</p><h3>Circuit moisture heatmap</h3></div><span className="mono heatmap-live">4 SECTORS / LIVE</span></div>
    <div className="heatmap-content"><svg viewBox="0 0 430 360" className="heatmap-track" role="img" aria-label="Silverstone sector moisture map"><defs><filter id="heatGlow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs><path d="M56 112 C79 45 190 8 294 41 C380 68 409 154 369 228 C334 291 250 335 162 331 C76 327 40 263 72 220" className="heatmap-track-base" />{segments.map((segment) => { const reading = readingFor(segment.sectorId); const color = getHeatmapColor(reading.condition, reading.saturation); const isActive = activeSector === segment.sectorId; return <g key={segment.sectorId} className="heatmap-segment" onClick={() => onSelect(segment.sectorId)}><path d={segment.path} style={{ stroke: color }} className={isActive ? "active" : ""} /><circle cx={segment.x} cy={segment.y} r={isActive ? 7 : 5} fill={color} filter={isActive ? "url(#heatGlow)" : undefined} /><text x={segment.x + 10} y={segment.y + 4}>{segment.sectorId === "Pit Lane" ? "PIT" : `S${segments.indexOf(segment) + 1}`} · {reading.saturation}%</text></g>; })}</svg>
      <div className="heatmap-key">{segments.map((segment) => { const reading = readingFor(segment.sectorId); const color = getHeatmapColor(reading.condition, reading.saturation); return <button key={segment.sectorId} className={activeSector === segment.sectorId ? "active" : ""} onClick={() => onSelect(segment.sectorId)}><i style={{ background: color }} /><span>{segment.sectorId}</span><b style={{ color }}>{reading.condition} · {reading.saturation}%</b><small>{getHeatmapBand(reading.saturation)} MOISTURE</small></button>; })}</div>
    </div>
  </section>;
}
