import { useState } from "react";
import { analyzeVideo } from "../api.js";

export default function VideoUploadPanel({ onNewReadings }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setResult(null);
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      const data = await analyzeVideo(file, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
      });
      setResult(data);
      onNewReadings(data.readings);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="section-title">Upload a video clip</div>
      <p style={{ color: "#9a9a9a", marginTop: 0 }}>
        Simulates a live camera by sampling frames from a recorded clip (e.g. onboard footage)
        and building the trend instantly — good for demoing "drying over time" without waiting
        in real life.
      </p>

      <div className="upload-row">
        <input type="file" accept="video/*" onChange={handleFileChange} />
        <button onClick={handleSubmit} disabled={!file || loading}>
          {loading ? `Processing... ${progress}%` : "Extract & analyze"}
        </button>
      </div>

      {error && <div className="error-text">{error}</div>}

      {result && (
        <div className="meta-row" style={{ marginTop: 10 }}>
          <span>{result.framesProcessed} frames extracted and classified</span>
        </div>
      )}
    </div>
  );
}
