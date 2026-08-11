import React from "react";
import { Sun, CloudDrizzle, CloudSun, CloudRain, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ConditionBadge({ label, confidence }) {
  if (!label) return null;

  const labelLower = label.toLowerCase();
  const badgeClass = `badge badge-${labelLower}`;

  const isLowConfidence = typeof confidence === "number" && confidence < 0.75;

  const renderIcon = () => {
    switch (labelLower) {
      case "dry":
        return <Sun size={16} />;
      case "damp":
        return <CloudDrizzle size={16} />;
      case "drying":
        return <CloudSun size={16} />;
      case "wet":
        return <CloudRain size={16} />;
      default:
        return <CheckCircle2 size={16} />;
    }
  };

  return (
    <div className="badge-group">
      <span className={badgeClass}>
        {renderIcon()}
        {label}
        {typeof confidence === "number" && (
          <span className="confidence-pill">
            {Math.round(confidence * 100)}%
          </span>
        )}
      </span>

      {isLowConfidence && (
        <span className="low-confidence-warning" title="AI confidence score is below 75%. Manual track-side inspection recommended.">
          <AlertTriangle size={14} />
          Low Confidence Flag ({Math.round(confidence * 100)}%)
        </span>
      )}
    </div>
  );
}