import React from "react";
import { Thermometer, Wind, Droplets, Compass, Sun } from "lucide-react";

export default function EnvironmentalGauge({ latestLabel, slope }) {
  // Compute simulated saturation & telemetry metrics based on label
  const getSaturation = () => {
    switch (latestLabel?.toLowerCase()) {
      case "wet": return 88;
      case "damp": return 62;
      case "drying": return 38;
      case "dry": return 5;
      default: return 0;
    }
  };

  const saturation = getSaturation();

  const getMeterColor = () => {
    if (saturation > 75) return "#3b82f6";
    if (saturation > 50) return "#f59e0b";
    if (saturation > 20) return "#fb923c";
    return "#10b981";
  };

  return (
    <div className="card">
      <div className="section-header">
        <div className="section-title">
          <Droplets size={20} color="#00f0ff" />
          <span>Surface Moisture & Environmental Gauge</span>
        </div>
        <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "JetBrains Mono" }}>
          Live Weather Station Link
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {/* Saturation Gauge Meter */}
        <div style={{ background: "var(--bg-input)", padding: 16, borderRadius: 12, border: "1px solid var(--border-card)", textAlign: "center" }}>
          <div className="meta-label" style={{ marginBottom: 8 }}>Track Saturation Index</div>
          
          <div style={{ position: "relative", width: 120, height: 60, margin: "0 auto 8px auto" }}>
            <svg viewBox="0 0 100 50" style={{ width: "100%", height: "100%" }}>
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={getMeterColor()}
                strokeWidth="10"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 * (1 - saturation / 100)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease" }}
              />
            </svg>
          </div>

          <div style={{ fontFamily: "JetBrains Mono", fontSize: 22, fontWeight: 700, color: getMeterColor() }}>
            {saturation}%
          </div>
        </div>

        {/* Environmental Telemetry Boxes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="meta-box">
            <div className="meta-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Thermometer size={12} color="#f59e0b" /> Track Temp
            </div>
            <div className="meta-value">31.4 °C</div>
          </div>

          <div className="meta-box">
            <div className="meta-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Sun size={12} color="#00f0ff" /> Air Temp
            </div>
            <div className="meta-value">25.8 °C</div>
          </div>

          <div className="meta-box">
            <div className="meta-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Wind size={12} color="#94a3b8" /> Wind Speed
            </div>
            <div className="meta-value">14.2 km/h</div>
          </div>

          <div className="meta-box">
            <div className="meta-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Compass size={12} color="#34d399" /> Wind Dir
            </div>
            <div className="meta-value">NW (310°)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
