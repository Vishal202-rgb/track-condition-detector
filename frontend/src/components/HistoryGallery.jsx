import { useEffect, useState } from "react";
import { getHistory, clearHistory } from "../api.js";
import { exportCSV, exportJSON } from "../utils/export.js";
import ConditionBadge from "./ConditionBadge.jsx";

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryGallery() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clearing, setClearing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getHistory();
      setReadings([...data].reverse());
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleClear() {
    const confirmed = window.confirm("Delete all history? This cannot be undone.");
    if (!confirmed) return;

    setClearing(true);
    setError(null);
    try {
      await clearHistory();
      setReadings([]);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setClearing(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="section-title">History</div>
        <p style={{ color: "#8a8a8a" }}>Loading past readings...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div className="section-title" style={{ marginBottom: 0 }}>
          History ({readings.length} readings)
        </div>
        {readings.length > 0 && (
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-secondary" onClick={() => exportCSV(readings)}>
              Export CSV
            </button>
            <button className="btn-secondary" onClick={() => exportJSON(readings)}>
              Export JSON
            </button>
            <button className="btn-secondary" onClick={handleClear} disabled={clearing}>
              {clearing ? "Clearing..." : "Clear history"}
            </button>
          </div>
        )}
      </div>

      {error && <div className="error-text">{error}</div>}

      {readings.length === 0 ? (
        <p style={{ color: "#8a8a8a" }}>No readings yet — analyze an image to get started.</p>
      ) : (
        <div className="history-grid">
          {readings.map((r) => (
            <div className="history-item" key={r._id}>
              <img src={r.imageUrl} alt={r.label} className="history-thumb" />
              <div className="history-item-body">
                <ConditionBadge label={r.label} confidence={r.confidence} />
                <div className="meta-row" style={{ marginTop: 8 }}>
                  <span>{formatTime(r.timestamp)}</span>
                  {r.weather && <span>{r.weather}</span>}
                  <span>{r.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}