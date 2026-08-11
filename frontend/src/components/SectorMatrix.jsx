import React from "react";
import { Grid, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function SectorMatrix({ activeSector, onSelectSector, latestLabel }) {
  // Simulated sector comparison matrix
  const sectors = [
    { id: "sector-1", name: "Sector 1 (Turn 1-4)", condition: activeSector === "sector-1" ? (latestLabel || "Dry") : "Dry", grip: "98%", compound: "Soft Slicks", risk: "Low" },
    { id: "sector-2", name: "Sector 2 (Chicane)", condition: activeSector === "sector-2" ? (latestLabel || "Damp") : "Damp", grip: "74%", compound: "Intermediate", risk: "Moderate" },
    { id: "sector-3", name: "Sector 3 (Straight)", condition: activeSector === "sector-3" ? (latestLabel || "Drying") : "Drying", grip: "85%", compound: "Medium Slicks", risk: "Low" },
    { id: "pit-lane", name: "Pit Lane", condition: activeSector === "pit-lane" ? (latestLabel || "Dry") : "Dry", grip: "99%", compound: "Slicks / Any", risk: "Low" },
  ];

  return (
    <div className="card">
      <div className="section-header">
        <div className="section-title">
          <Grid size={20} color="#00f0ff" />
          <span>Multi-Sector Track Comparison Matrix</span>
        </div>
        <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "JetBrains Mono" }}>
          Full Circuit Overview
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}>
              <th style={{ padding: "10px 12px" }}>Track Sector</th>
              <th style={{ padding: "10px 12px" }}>Surface State</th>
              <th style={{ padding: "10px 12px" }}>Est. Grip Level</th>
              <th style={{ padding: "10px 12px" }}>Recommended Tire</th>
              <th style={{ padding: "10px 12px" }}>Aquaplaning Risk</th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((s) => {
              const isActive = activeSector === s.id;
              return (
                <tr
                  key={s.id}
                  onClick={() => onSelectSector(s.id)}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: isActive ? "rgba(0, 240, 255, 0.06)" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                >
                  <td style={{ padding: "12px", fontWeight: 600, color: isActive ? "#00f0ff" : "#f8fafc" }}>
                    {s.name} {isActive && "◀"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span className={`badge badge-${s.condition.toLowerCase()}`} style={{ fontSize: 11, padding: "3px 8px" }}>
                      {s.condition}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontFamily: "JetBrains Mono", fontWeight: 700, color: "#34d399" }}>
                    {s.grip}
                  </td>
                  <td style={{ padding: "12px", color: "#cbd5e1" }}>
                    {s.compound}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      color: s.risk === "High" ? "#fca5a5" : s.risk === "Moderate" ? "#fde68a" : "#a7f3d0"
                    }}>
                      {s.risk === "Low" ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                      {s.risk}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
