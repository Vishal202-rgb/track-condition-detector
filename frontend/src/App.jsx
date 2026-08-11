import { useEffect, useState, useCallback } from "react";
import { Gauge, RefreshCw } from "lucide-react";
import UploadPanel from "./components/UploadPanel.jsx";
import TrendChart from "./components/TrendChart.jsx";
import SectorSelector from "./components/SectorSelector.jsx";
import CircuitMap from "./components/CircuitMap.jsx";
import EnvironmentalGauge from "./components/EnvironmentalGauge.jsx";
import LiveSimulationBar from "./components/LiveSimulationBar.jsx";
import SectorMatrix from "./components/SectorMatrix.jsx";
import ExportToolbar from "./components/ExportToolbar.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { getTrend } from "./api.js";

const POLL_INTERVAL_MS = 4000;

export default function App() {
  const [trend, setTrend] = useState(null);
  const [activeSector, setActiveSector] = useState("sector-1");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshTrend = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getTrend(activeSector);
      setTrend(data);
    } catch (err) {
      console.error("Failed to fetch track telemetry trend:", err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeSector]);

  useEffect(() => {
    refreshTrend();
    const interval = setInterval(refreshTrend, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshTrend]);

  return (
    <ErrorBoundary>
      <div className="app-container">
        <header className="header-bar">
          <div className="brand-section">
            <h1>
              <Gauge size={32} color="#00f0ff" />
              TrackSense AI
            </h1>
            <p>
              Pro Racing Telemetry, Track Surface Classification & Pit Strategy Engine
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="status-pill">
              <span className="pulse-dot" />
              <span>LIVE TELEMETRY</span>
            </div>
            <button
              className="sector-btn"
              onClick={refreshTrend}
              title="Refresh Telemetry Stream"
              style={{ padding: "8px 12px" }}
            >
              <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
            </button>
          </div>
        </header>

        {/* 1. Quick Demo Preset & Simulation Bar */}
        <LiveSimulationBar activeSector={activeSector} onNewReading={refreshTrend} />

        {/* 2. Track Sector Selector & SVG Circuit Map */}
        <SectorSelector activeSector={activeSector} onSectorChange={setActiveSector} />
        <CircuitMap
          activeSector={activeSector}
          onSelectSector={setActiveSector}
          latestLabel={trend?.latestLabel}
        />

        {/* 3. Surface Moisture & Environmental Telemetry Gauge */}
        <EnvironmentalGauge
          latestLabel={trend?.latestLabel}
          slope={trend?.slope}
        />

        {/* 4. Frame Upload Panel & AI Classifier */}
        <UploadPanel activeSector={activeSector} onNewReading={refreshTrend} />

        {/* 5. Live Strategy Trend Chart */}
        <TrendChart trend={trend} />

        {/* 6. Multi-Sector Comparison Matrix */}
        <SectorMatrix
          activeSector={activeSector}
          onSelectSector={setActiveSector}
          latestLabel={trend?.latestLabel}
        />

        {/* 7. Export & Engineering Debrief Toolbar */}
        <ExportToolbar trend={trend} onRefresh={refreshTrend} />
      </div>
    </ErrorBoundary>
  );
}
