import React from "react";
import { Navigation, MapPin } from "lucide-react";

export default function CircuitMap({ activeSector, onSelectSector, latestLabel }) {
  const getSectorColor = (sectorId) => {
    if (activeSector === sectorId) {
      if (latestLabel === "Wet") return "#3b82f6";
      if (latestLabel === "Damp") return "#f59e0b";
      if (latestLabel === "Drying") return "#fb923c";
      return "#10b981";
    }
    return "#64748b";
  };

  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      <div className="section-header">
        <div className="section-title">
          <Navigation size={20} color="#00f0ff" />
          <span>Interactive Track Map & Sector Heatmap</span>
        </div>
        <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "JetBrains Mono" }}>
          Grand Prix Circuit Layout
        </span>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        {/* SVG Track Layout */}
        <div style={{ flex: "1 1 300px", minWidth: 260, height: 180, position: "relative", background: "rgba(11, 15, 23, 0.6)", borderRadius: 12, padding: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
          <svg viewBox="0 0 400 200" style={{ width: "100%", height: "100%" }}>
            {/* Track Outer Path */}
            <path
              d="M 60 140 C 30 140 30 60 80 60 L 220 60 C 260 60 280 90 320 90 C 360 90 370 140 330 150 L 140 150 Z"
              fill="none"
              stroke="#1e293b"
              strokeWidth="24"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 60 140 C 30 140 30 60 80 60 L 220 60 C 260 60 280 90 320 90 C 360 90 370 140 330 150 L 140 150 Z"
              fill="none"
              stroke="#334155"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Active Racing Line glow */}
            <path
              d="M 60 140 C 30 140 30 60 80 60 L 220 60 C 260 60 280 90 320 90 C 360 90 370 140 330 150 L 140 150 Z"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2"
              strokeDasharray="6 6"
              opacity="0.7"
            />

            {/* Sector Pins */}
            {/* Sector 1 */}
            <g
              style={{ cursor: "pointer" }}
              onClick={() => onSelectSector("sector-1")}
            >
              <circle cx="70" cy="90" r="10" fill={getSectorColor("sector-1")} opacity="0.9" />
              <circle cx="70" cy="90" r="14" fill="none" stroke={getSectorColor("sector-1")} strokeWidth="2">
                {activeSector === "sector-1" && (
                  <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                )}
              </circle>
              <text x="70" y="93" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">S1</text>
            </g>

            {/* Sector 2 */}
            <g
              style={{ cursor: "pointer" }}
              onClick={() => onSelectSector("sector-2")}
            >
              <circle cx="200" cy="60" r="10" fill={getSectorColor("sector-2")} opacity="0.9" />
              <circle cx="200" cy="60" r="14" fill="none" stroke={getSectorColor("sector-2")} strokeWidth="2">
                {activeSector === "sector-2" && (
                  <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                )}
              </circle>
              <text x="200" y="63" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">S2</text>
            </g>

            {/* Sector 3 */}
            <g
              style={{ cursor: "pointer" }}
              onClick={() => onSelectSector("sector-3")}
            >
              <circle cx="330" cy="120" r="10" fill={getSectorColor("sector-3")} opacity="0.9" />
              <circle cx="330" cy="120" r="14" fill="none" stroke={getSectorColor("sector-3")} strokeWidth="2">
                {activeSector === "sector-3" && (
                  <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                )}
              </circle>
              <text x="330" y="123" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">S3</text>
            </g>

            {/* Pit Lane */}
            <g
              style={{ cursor: "pointer" }}
              onClick={() => onSelectSector("pit-lane")}
            >
              <circle cx="230" cy="150" r="10" fill={getSectorColor("pit-lane")} opacity="0.9" />
              <circle cx="230" cy="150" r="14" fill="none" stroke={getSectorColor("pit-lane")} strokeWidth="2">
                {activeSector === "pit-lane" && (
                  <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                )}
              </circle>
              <text x="230" y="153" textAnchor="middle" fill="#000" fontSize="9" fontWeight="bold">PIT</text>
            </g>
          </svg>
        </div>

        {/* Legend & Active Info */}
        <div style={{ flex: "1 1 200px" }}>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>
            Click a sector marker on the circuit to switch camera telemetry.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#cbd5e1" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
              Dry Line (Slicks)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#cbd5e1" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fb923c" }} />
              Drying Line
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#cbd5e1" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
              Damp Surface
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#cbd5e1" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }} />
              Wet / Standing Water
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
