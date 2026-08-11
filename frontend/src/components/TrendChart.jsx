import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { TrendingDown, TrendingUp, Minus, Activity, ShieldAlert } from "lucide-react";

const INDEX_TO_LABEL = ["Dry", "Drying", "Damp", "Wet"];

const RISK_SYMBOLS = {
  Safe: "✓",
  Caution: "⚠",
  Danger: "⛔",
};

function formatTime(ts) {
  if (!ts) return "";
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
  if (!trend || !trend.readings || trend.readings.length === 0) {
    return (
      <div className="card">
        <div className="section-title">
          <Activity size={20} color="#00f0ff" />
          <span>Live Track Moisture Trend Telemetry</span>
        </div>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: "16px 0" }}>
          No telemetry readings captured yet — upload a track image above to start tracking surface moisture evolution.
        </p>
      </div>
    );
  }

  const chartData = trend.readings.map((r) => ({
    time: formatTime(r.timestamp),
    wetnessIndex: r.wetnessIndex,
    label: r.label,
    confidence: r.confidence ? Math.round(r.confidence * 100) + "%" : "N/A",
  }));

  const bannerClass =
    trend.trendDirection === "drying"
      ? "suggestion-drying"
      : trend.trendDirection === "wetting"
      ? "suggestion-wetting"
      : "suggestion-stable";

  const etaText = formatEta(trend.etaMinutes);
  const directionSymbol =
    trend.trendDirection === "drying" ? "↓" : trend.trendDirection === "wetting" ? "↑" : "→";

  const renderTrendIcon = () => {
    if (trend.trendDirection === "drying") return <TrendingDown size={18} color="#f59e0b" />;
    if (trend.trendDirection === "wetting") return <TrendingUp size={18} color="#3b82f6" />;
    return <Minus size={18} color="#10b981" />;
  };

  return (
    <div className="card">
      <div className="section-header">
        <div className="section-title">
          <Activity size={20} color="#00f0ff" />
          <span>Live Moisture & Strategy Telemetry</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", fontFamily: "JetBrains Mono" }}>
          <span>Trend:</span>
          <span style={{ textTransform: "capitalize", fontWeight: 600, color: "#f8fafc" }}>
            {trend.trendDirection}
          </span>
          {renderTrendIcon()}
        </div>
      </div>

      <div style={{ width: "100%", height: 250, marginTop: 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="wetnessGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              fontFamily="JetBrains Mono"
              tickLine={false}
            />
            <YAxis
              domain={[0, 3]}
              ticks={[0, 1, 2, 3]}
              tickFormatter={(v) => INDEX_TO_LABEL[v] || v}
              stroke="#64748b"
              fontSize={11}
              fontFamily="JetBrains Mono"
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0b0f17",
                border: "1px solid rgba(0, 240, 255, 0.3)",
                borderRadius: "10px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                color: "#f8fafc",
                fontSize: "13px",
              }}
              formatter={(value, name, props) => [
                `${props.payload.label} (Index: ${value})`,
                "Condition",
              ]}
              labelFormatter={(time) => `Timestamp: ${time}`}
            />
            <ReferenceLine y={1} stroke="rgba(245, 158, 11, 0.3)" strokeDasharray="4 4" label={{ value: 'Dry Threshold', fill: '#f59e0b', fontSize: 10 }} />
            <ReferenceLine y={2} stroke="rgba(59, 130, 246, 0.3)" strokeDasharray="4 4" label={{ value: 'Wet Threshold', fill: '#3b82f6', fontSize: 10 }} />
            <Area
              type="monotone"
              dataKey="wetnessIndex"
              stroke="#00f0ff"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#wetnessGradient)"
              dot={{ r: 4, fill: "#00f0ff", stroke: "#090c10", strokeWidth: 2 }}
              activeDot={{ r: 7, fill: "#ffffff", stroke: "#00f0ff", strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={`suggestion-banner ${bannerClass}`}>
        <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>Tire & Pit Strategy Recommendation</div>
          <div>{trend.suggestion}</div>
        </div>
      </div>

      <div className="meta-grid">
        <div className="meta-box">
          <div className="meta-label">Track Moisture Slope</div>
          <div className="meta-value">
            {trend.slope > 0 ? `+${trend.slope.toFixed(2)}` : trend.slope.toFixed(2)} / step
          </div>
        </div>
        <div className="meta-box">
          <div className="meta-label">Latest Track Condition</div>
          <div className="meta-value" style={{ color: "#00f0ff" }}>
            {trend.latestLabel || "N/A"}
          </div>
        </div>
        <div className="meta-box">
          <div className="meta-label">Total Sample Frames</div>
          <div className="meta-value">{trend.readings.length}</div>
        </div>
      </div>
    </div>
  );
}