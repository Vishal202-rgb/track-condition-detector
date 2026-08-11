import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const INDEX_TO_LABEL = ["Dry", "Drying", "Damp", "Wet"];

const RISK_SYMBOLS = {
  Safe: "✓",
  Caution: "⚠",
  Danger: "⛔",
};

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatEta(minutes) {
  if (minutes === null || minutes === undefined) return null;
  if (minutes < 1) return "less than a minute";
  if (minutes > 120) return "60+ minutes";
  return `~${minutes} min`;
}

export default function TrendChart({ trend }) {
  if (!trend || trend.readings.length === 0) {
    return (
      <div className="card">
        <div className="section-title">Trend</div>
        <p style={{ color: "#8a8a8a" }}>No readings yet — analyze an image to start tracking.</p>
      </div>
    );
  }

  const chartData = trend.readings.map((r) => ({
    time: formatTime(r.timestamp),
    wetnessIndex: r.wetnessIndex,
    label: r.label,
  }));

  const etaText = formatEta(trend.etaMinutes);
  const directionSymbol =
    trend.trendDirection === "drying" ? "↓" : trend.trendDirection === "wetting" ? "↑" : "→";

  return (
    <div className="card">
      <div className="section-title">Trend</div>

      {trend.riskLevel && (
        <div className={`risk-badge risk-${trend.riskLevel.level.toLowerCase()}`}>
          <span className="risk-symbol">{RISK_SYMBOLS[trend.riskLevel.level]}</span>
          <span className="risk-label">{trend.riskLevel.level}</span>
          <span className="risk-reason">{trend.riskLevel.reason}</span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid stroke="#2b2b2b" strokeDasharray="3 3" />
          <XAxis dataKey="time" stroke="#8a8a8a" fontSize={12} />
          <YAxis
            domain={[0, 3]}
            ticks={[0, 1, 2, 3]}
            tickFormatter={(v) => INDEX_TO_LABEL[v]}
            stroke="#8a8a8a"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{ background: "#141414", border: "1px solid #2b2b2b", color: "#f5f5f5" }}
            labelStyle={{ color: "#f5f5f5" }}
            formatter={(value, name, props) => [props.payload.label, "Condition"]}
          />
          <Line
            type="monotone"
            dataKey="wetnessIndex"
            stroke="#f5f5f5"
            strokeWidth={2}
            dot={{ r: 3, fill: "#f5f5f5" }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="suggestion-banner">
        <span className="direction-symbol">{directionSymbol}</span>
        {trend.suggestion}
      </div>

      {etaText && (
        <div className="eta-banner">
          Estimated time until fully <strong>{trend.etaLabel}</strong>: {etaText}
        </div>
      )}

      {trend.weatherAlert?.mismatch && (
        <div className="weather-alert-banner">
          <strong>Stale weather report detected:</strong> {trend.weatherAlert.message}
        </div>
      )}

      <div className="meta-row">
        <span>Trend direction: {trend.trendDirection}</span>
        <span>Slope: {trend.slope.toFixed(2)}</span>
        <span>Latest: {trend.latestLabel}</span>
      </div>
    </div>
  );
}