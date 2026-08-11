import { useState } from "react";
import { UploadCloud, Sparkles, Sun, CloudRain, Wind, AlertCircle, Cpu, FileText } from "lucide-react";
import { analyzeImage } from "../api.js";
import { getBrowserLocation, fetchWeather } from "../utils/weather.js";
import ConditionBadge from "./ConditionBadge.jsx";
import SkeletonLoader from "./SkeletonLoader.jsx";

const WEATHER_PRESETS = [
  { label: "Sunny (28°C)", value: "Sunny 28°C, High Track Temp", icon: Sun },
  { label: "Light Drizzle", value: "Light Drizzle, 20°C, Overcast", icon: CloudRain },
  { label: "Heavy Rain", value: "Heavy Rain, Standing Water 16°C", icon: CloudRain },
  { label: "Cloudy & Drying", value: "Cloudy 22°C, Moderate Wind", icon: Wind },
];

export default function UploadPanel({ activeSector, onNewReading }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [weather, setWeather] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  function handleFileSelected(selected) {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError(null);
  }

  function handleFileChange(e) {
    handleFileSelected(e.target.files[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave() {
    setIsDragActive(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeImage(file, weather, activeSector);
      setLastResult(result);
      if (onNewReading) onNewReading(result);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to analyze track image.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="section-header">
        <div className="section-title">
          <UploadCloud size={20} color="#00f0ff" />
          <span>Track Frame Image Upload</span>
        </div>
        <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "JetBrains Mono" }}>
          Target: Sector {activeSector?.toUpperCase() || "SEC-01"}
        </span>
      </div>

      <div
        className={`dropzone ${isDragActive ? "active" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <UploadCloud size={36} className="upload-icon" />
        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
          {file ? file.name : "Drag & drop track image, or click to browse"}
        </p>
        <p style={{ fontSize: 12, color: "#64748b" }}>
          Supports JPG, PNG, WEBP (High-res track telemetry frames)
        </p>
      </div>

      <div className="weather-presets">
        <span style={{ fontSize: 12, color: "#94a3b8", alignSelf: "center", marginRight: 4 }}>
          Weather Presets:
        </span>
        {WEATHER_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isActive = weather === preset.value;
          return (
            <button
              key={preset.label}
              type="button"
              className={`preset-chip ${isActive ? "active" : ""}`}
              onClick={() => setWeather(preset.value)}
            >
              <Icon size={12} />
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="input-row">
        <input
          type="text"
          className="weather-input"
          placeholder="e.g. Ambient 24°C, Air Humidity 65%, Track Temp 30°C"
          value={weather}
          onChange={(e) => setWeather(e.target.value)}
        />
        <button className="btn-primary" onClick={handleSubmit} disabled={!file || loading}>
          <Sparkles size={16} />
          {loading ? "Analyzing Frame..." : "Analyze Track Surface"}
        </button>
      </div>

      {preview && (
        <div className="preview-container">
          <img className="preview-img" src={preview} alt="Track preview" />
        </div>
      )}

      {loading && <SkeletonLoader type="badge" />}

      {error && (
        <div className="error-banner">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button className="btn-retry" onClick={handleSubmit}>
            Retry Analysis
          </button>
        </div>
      )}

      {lastResult && !loading && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <ConditionBadge label={lastResult.label} confidence={lastResult.confidence} />

          <div className="meta-grid">
            <div className="meta-box">
              <div className="meta-label">Classification Reason</div>
              <div className="meta-value" style={{ fontSize: 13, fontFamily: "Inter", color: "#e2e8f0" }}>
                {lastResult.reasoning}
              </div>
            </div>
            <div className="meta-box">
              <div className="meta-label">Detection Engine</div>
              <div className="meta-value" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Cpu size={14} color="#00f0ff" />
                {lastResult.source || "AI Vision Model"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}