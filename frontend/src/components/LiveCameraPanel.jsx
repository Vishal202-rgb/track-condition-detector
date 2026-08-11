import { useRef, useState, useEffect, useCallback } from "react";
import { analyzeImage } from "../api.js";
import ConditionBadge from "./ConditionBadge.jsx";

const CAPTURE_INTERVAL_MS = 5000;

export default function LiveCameraPanel({ onNewReading }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [isLive, setIsLive] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [captureCount, setCaptureCount] = useState(0);
  const [unsupported, setUnsupported] = useState(false);

  // Check camera support up front so we show a clear message instead of
  // crashing when the button is pressed on an unsupported browser/context.
  useEffect(() => {
    const isSecure = window.isSecureContext;
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    if (!isSecure) {
      setUnsupported(true);
      setError("Camera requires a secure connection (HTTPS). This page is not served over HTTPS.");
    } else if (!hasMediaDevices) {
      setUnsupported(true);
      setError("Camera API is not supported in this browser.");
    }
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        async (blob) => {
          if (!blob) return;
          const file = new File([blob], `live-${Date.now()}.jpg`, { type: "image/jpeg" });
          try {
            const result = await analyzeImage(file);
            setLastResult(result);
            setCaptureCount((c) => c + 1);
            onNewReading(result);
          } catch (err) {
            setError(err.response?.data?.error || err.message);
          }
        },
        "image/jpeg",
        0.85
      );
    } catch (err) {
      setError("Capture failed: " + err.message);
    }
  }, [onNewReading]);

  async function startLive() {
    setError(null);
    if (unsupported) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play() failed, continuing anyway:", playErr.message);
        }
      }
      setIsLive(true);
    } catch (err) {
      let message = "Could not access camera: " + err.message;
      if (err.name === "NotAllowedError") {
        message = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (err.name === "NotFoundError") {
        message = "No camera found on this device.";
      }
      setError(message);
    }
  }

  function stopLive() {
    setIsLive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  useEffect(() => {
    if (isLive) {
      captureAndAnalyze();
      intervalRef.current = setInterval(captureAndAnalyze, CAPTURE_INTERVAL_MS);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLive, captureAndAnalyze]);

  useEffect(() => {
    return () => stopLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card">
      <div className="section-title">Live camera feed</div>

      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          width: "100%",
          maxHeight: 320,
          borderRadius: 8,
          background: "#000",
          display: isLive ? "block" : "none",
        }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {!isLive && !unsupported && (
        <p style={{ color: "#8a8a8a", marginTop: 0 }}>
          Starts your camera and auto-analyzes a frame every {CAPTURE_INTERVAL_MS / 1000}s.
        </p>
      )}

      <div className="upload-row" style={{ marginTop: 12 }}>
        {!isLive ? (
          <button onClick={startLive} disabled={unsupported}>
            Start live feed
          </button>
        ) : (
          <button onClick={stopLive} className="btn-secondary">
            Stop live feed
          </button>
        )}
        {isLive && (
          <span style={{ color: "#8a8a8a", fontSize: 13 }}>
            Captures taken: {captureCount}
          </span>
        )}
      </div>

      {error && <div className="error-text">{error}</div>}

      {lastResult && (
        <div style={{ marginTop: 14 }}>
          <ConditionBadge label={lastResult.label} confidence={lastResult.confidence} />
          <div className="meta-row">
            <span>Reasoning: {lastResult.reasoning}</span>
          </div>
        </div>
      )}
    </div>
  );
}