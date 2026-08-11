import React from "react";

export default function SkeletonLoader({ type = "card" }) {
  if (type === "badge") {
    return (
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <div className="skeleton" style={{ width: 120, height: 32, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 8 }} />
      </div>
    );
  }

  if (type === "chart") {
    return (
      <div className="card">
        <div className="skeleton skeleton-text" style={{ width: "30%", height: 24, marginBottom: 20 }} />
        <div className="skeleton skeleton-box" style={{ height: 200, borderRadius: 12 }} />
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div className="skeleton skeleton-text" style={{ width: "60%", height: 20 }} />
      <div className="skeleton skeleton-text" style={{ width: "40%", height: 16 }} />
      <div className="skeleton skeleton-box" style={{ marginTop: 12 }} />
    </div>
  );
}
