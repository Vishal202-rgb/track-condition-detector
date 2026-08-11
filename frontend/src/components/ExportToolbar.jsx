import { useState } from "react";
import { Download, Printer, Database, Check } from "lucide-react";
import { seedDemoData } from "../api.js";

export default function ExportToolbar({ trend, onRefresh }) {
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  function handleExportCSV() {
    if (!trend || !trend.readings || trend.readings.length === 0) {
      alert("No telemetry readings available to export.");
      return;
    }

    const headers = ["Timestamp", "Sector ID", "Label", "Wetness Index", "Confidence", "Weather", "Reasoning", "Source"];
    const rows = trend.readings.map((r) => [
      `"${new Date(r.timestamp).toISOString()}"`,
      `"${r.sectorId || "sector-1"}"`,
      `"${r.label}"`,
      r.wetnessIndex,
      r.confidence || 0,
      `"${(r.weather || "").replace(/"/g, '""')}"`,
      `"${(r.reasoning || "").replace(/"/g, '""')}"`,
      `"${r.source || "ai"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tracksense_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handlePrintReport() {
    window.print();
  }

  async function handleSeedData() {
    setSeeding(true);
    try {
      await seedDemoData();
      setSeeded(true);
      if (onRefresh) onRefresh();
      setTimeout(() => setSeeded(false), 3000);
    } catch (err) {
      console.error("Failed to seed demo data:", err);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
          Telemetry Data & Export Control
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          Download CSV telemetry logs or print engineering debrief report
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          className="sector-btn"
          onClick={handleSeedData}
          disabled={seeding}
          style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-card)" }}
        >
          {seeded ? <Check size={14} color="#10b981" /> : <Database size={14} />}
          {seeding ? "Seeding..." : seeded ? "Seeded!" : "Seed Demo History"}
        </button>

        <button
          className="sector-btn"
          onClick={handleExportCSV}
          style={{ background: "rgba(0, 240, 255, 0.1)", border: "1px solid rgba(0, 240, 255, 0.3)", color: "var(--accent-cyan)" }}
        >
          <Download size={14} />
          Export CSV Log
        </button>

        <button
          className="sector-btn"
          onClick={handlePrintReport}
          style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-card)" }}
        >
          <Printer size={14} />
          Print Debrief Report
        </button>
      </div>
    </div>
  );
}
