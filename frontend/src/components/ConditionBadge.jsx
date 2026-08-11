const LABEL_SYMBOLS = {
  Dry: "○",
  Damp: "◐",
  Drying: "↝",
  Wet: "●",
};

const LOW_CONFIDENCE_THRESHOLD = 0.6;

export default function ConditionBadge({ label, confidence }) {
  if (!label) return null;

  const isLowConfidence =
    typeof confidence === "number" && confidence < LOW_CONFIDENCE_THRESHOLD;

  return (
    <span className={`badge ${isLowConfidence ? "badge-uncertain" : ""}`}>
      <span className="badge-symbol">{LABEL_SYMBOLS[label] || "•"}</span>
      {label}
      {typeof confidence === "number" && (
        <span className="badge-confidence">{Math.round(confidence * 100)}%</span>
      )}
      {isLowConfidence && (
        <span className="badge-flag" title="Low confidence reading — verify manually">
          ⚠
        </span>
      )}
    </span>
  );
}