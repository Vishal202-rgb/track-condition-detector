import { useState } from "react";
import { Play, Sparkles, Image, CheckCircle2 } from "lucide-react";
import { generateSampleTrackImage, DEMO_PRESETS } from "../utils/demoData.js";
import { analyzeImage } from "../api.js";

export default function LiveSimulationBar({ activeSector = "sector-1", onNewReading }) {
  const [simulating, setSimulating] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  async function handleRunPreset(presetId) {
    setActivePreset(presetId);
    try {
      const imageFile = await generateSampleTrackImage(presetId);
      const presetInfo = DEMO_PRESETS.find((p) => p.id === presetId);
      const result = await analyzeImage(imageFile, presetInfo?.temp || "", activeSector);
      if (onNewReading) onNewReading(result);
    } catch (err) {
      console.error("Failed to run preset analysis:", err);
    } finally {
      setActivePreset(null);
    }
  }

  async function handleSimulateSession() {
    setSimulating(true);
    const sequence = ["wet", "damp", "drying", "dry"];
    for (const step of sequence) {
      try {
        setActivePreset(step);
        const imageFile = await generateSampleTrackImage(step);
        const presetInfo = DEMO_PRESETS.find((p) => p.id === step);
        const result = await analyzeImage(imageFile, `${presetInfo?.label} - Telemetry Sim`, activeSector);
        if (onNewReading) onNewReading(result);
        await new Promise((r) => setTimeout(r, 1200));
      } catch (err) {
        console.error("Simulation step error:", err);
      }
    }
    setSimulating(false);
    setActivePreset(null);
  }

  return (
    <div className="card" style={{ background: "linear-gradient(135deg, rgba(0,240,255,0.05) 0%, rgba(59,130,246,0.05) 100%)", border: "1px solid rgba(0,240,255,0.2)" }}>
      <div className="section-header">
        <div className="section-title">
          <Sparkles size={20} color="#00f0ff" />
          <span>Quick Demo Presets & Automated Race Simulation</span>
        </div>
        <button
          className="btn-primary"
          onClick={handleSimulateSession}
          disabled={simulating}
          style={{ padding: "8px 16px", fontSize: 13 }}
        >
          <Play size={14} />
          {simulating ? "Running Race Sim..." : "Simulate 4-Lap Weather Shift"}
        </button>
      </div>

      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 14 }}>
        Click any track surface preset to instantly generate and analyze realistic track imagery:
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
        {DEMO_PRESETS.map((preset) => {
          const isLoading = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleRunPreset(preset.id)}
              disabled={simulating || isLoading}
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-card)",
                borderRadius: 12,
                padding: "12px 14px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-cyan)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-card)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>{preset.icon}</span>
                <span style={{ fontSize: 10, color: "var(--accent-cyan)", fontFamily: "JetBrains Mono" }}>
                  {isLoading ? "Analyzing..." : "Analyze"}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                {preset.label}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {preset.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
