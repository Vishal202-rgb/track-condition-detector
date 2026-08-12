import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { ChallengeDemoPanel } from "@/components/ChallengeDemoPanel";
import { CircuitMoistureHeatmap } from "@/components/CircuitMoistureHeatmap";
import { VideoFrameAnalyzer } from "@/components/VideoFrameAnalyzer";
import { Button } from "@/components/ui/button";
import { getHeatmapColor } from "@shared/heatmap";
import { isJudgeModeRequested, publishJudgeMode } from "@shared/presentationMode";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, ChevronRight, CloudRain, Download, Flag, Gauge, Info, Play, Presentation, Printer, RefreshCw, ScanLine, ShieldCheck, Sparkles, TimerReset, UploadCloud, Video, Wind, X, Zap } from "lucide-react";
import { toast } from "sonner";

const sectors = ["Sector 1 (Turn 1–4)", "Sector 2 (Chicane)", "Sector 3 (Straight)", "Pit Lane"] as const;
const conditions = ["Dry", "Damp", "Wet", "Drying"] as const;
const strategies = ["Slicks", "Intermediates", "Full Wets"] as const;
const scenarios = ["dry race", "safety car wet", "drying track"] as const;
type Sector = typeof sectors[number];
type Scenario = typeof scenarios[number];

type Reading = { condition: string; confidence: number; saturation: number; tireStrategy: string; pitWindowLap: number; slope: string; temp: string; humidity: string; windSpeed: string; sectorId: Sector; source: string; createdAt: Date | string };

const seedReadings: Reading[] = [
  { condition: "Dry", confidence: 96, saturation: 11, tireStrategy: "Slicks", pitWindowLap: 18, slope: "Drying (-0.4/lap)", temp: "24°C", humidity: "58%", windSpeed: "12 km/h", sectorId: sectors[0], source: "telemetry", createdAt: new Date() },
  { condition: "Drying", confidence: 88, saturation: 34, tireStrategy: "Intermediates", pitWindowLap: 7, slope: "Drying (-2.8/lap)", temp: "22°C", humidity: "64%", windSpeed: "15 km/h", sectorId: sectors[1], source: "telemetry", createdAt: new Date() },
  { condition: "Damp", confidence: 81, saturation: 47, tireStrategy: "Intermediates", pitWindowLap: 5, slope: "Wetting (+1.6/lap)", temp: "21°C", humidity: "69%", windSpeed: "18 km/h", sectorId: sectors[2], source: "telemetry", createdAt: new Date() },
  { condition: "Wet", confidence: 92, saturation: 78, tireStrategy: "Full Wets", pitWindowLap: 2, slope: "Wetting (+4.2/lap)", temp: "19°C", humidity: "76%", windSpeed: "21 km/h", sectorId: sectors[3], source: "telemetry", createdAt: new Date() },
];

const trendData = [
  { lap: "L01", sector1: 18, sector2: 25, sector3: 36, pit: 56 },
  { lap: "L02", sector1: 16, sector2: 29, sector3: 39, pit: 62 },
  { lap: "L03", sector1: 15, sector2: 33, sector3: 42, pit: 68 },
  { lap: "L04", sector1: 13, sector2: 36, sector3: 44, pit: 73 },
  { lap: "L05", sector1: 12, sector2: 34, sector3: 47, pit: 77 },
  { lap: "L06", sector1: 11, sector2: 34, sector3: 50, pit: 80 },
  { lap: "L07", sector1: 10, sector2: 32, sector3: 53, pit: 82 },
  { lap: "L08", sector1: 11, sector2: 31, sector3: 55, pit: 84 },
];

function formatTime() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }

function StatusPill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "cyan" | "amber" | "red" }) {
  return <span className={`status-pill status-${tone}`}><span className="status-dot" />{children}</span>;
}

function TelemetryCard({ label, value, meta, icon: Icon, tone = "green" }: { label: string; value: string; meta: string; icon: React.ElementType; tone?: "green" | "cyan" | "amber" | "red" }) {
  return <div className={`metric-card metric-${tone}`}><div className="metric-top"><span className="metric-label">{label}</span><Icon className="h-4 w-4 opacity-80" /></div><div className="metric-value">{value}</div><div className="metric-meta">{meta}</div></div>;
}

function SaturationGauge({ value, label = "SURFACE SATURATION" }: { value: number; label?: string }) {
  const safeValue = Math.min(100, Math.max(0, value));
  return <div className="gauge-wrap">
    <div className="gauge-title"><span>{label}</span><span className="mono accent-text">{safeValue}%</span></div>
    <div className="gauge-track"><div className="gauge-fill" style={{ width: `${safeValue}%` }} /><div className="gauge-marker" style={{ left: `${safeValue}%` }} /></div>
    <div className="gauge-scale"><span>DRY</span><span>DAMP</span><span>WET</span></div>
  </div>;
}

function CircuitMap({ activeSector, onSelect }: { activeSector: Sector; onSelect: (sector: Sector) => void }) {
  const points = [
    { id: sectors[0], d: "M72 108 C105 30 210 22 288 52 C330 68 349 100 334 130 C312 173 235 165 206 131 C177 98 132 93 72 108", x: 170, y: 48, color: "#b7ff39" },
    { id: sectors[1], d: "M334 130 C371 156 388 201 354 232 C319 264 245 251 206 219 C170 190 130 192 103 218", x: 340, y: 180, color: "#57e9ff" },
    { id: sectors[2], d: "M103 218 C71 250 73 297 119 315 C171 335 220 310 242 282", x: 131, y: 287, color: "#ffb14a" },
    { id: sectors[3], d: "M242 282 L296 307", x: 280, y: 305, color: "#ff5e72" },
  ];
  return <div className="circuit-map-wrap"><div className="map-toolbar"><span className="eyebrow">CIRCUIT TOPOLOGY</span><span className="mono subtle-text">LIVE / SILVERSTONE GP</span></div><svg viewBox="0 0 430 360" className="circuit-map" role="img" aria-label="Interactive circuit map"><defs><filter id="glow"><feGaussianBlur stdDeviation="5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs><path d="M56 112 C79 45 190 8 294 41 C380 68 409 154 369 228 C334 291 250 335 162 331 C76 327 40 263 72 220" className="track-shadow" /><path d="M56 112 C79 45 190 8 294 41 C380 68 409 154 369 228 C334 291 250 335 162 331 C76 327 40 263 72 220" className="track-base" />{points.map((point) => <g key={point.id} onClick={() => onSelect(point.id)} className="map-sector"><path d={point.d} className={`map-segment ${activeSector === point.id ? "active" : ""}`} style={{ stroke: point.color }} /><circle cx={point.x} cy={point.y} r={activeSector === point.id ? 7 : 5} fill={point.color} filter={activeSector === point.id ? "url(#glow)" : undefined} /><text x={point.x + 10} y={point.y + 4} fill={activeSector === point.id ? "#ffffff" : "#7f8a9c"} className="map-label">{point.id.replace("Sector ", "S")}</text></g>)}</svg><div className="map-legend">{points.map(point => <button key={point.id} onClick={() => onSelect(point.id)} className={activeSector === point.id ? "selected" : ""}><span className="legend-swatch" style={{ background: point.color }} />{point.id.replace("Sector ", "S")}</button>)}</div></div>;
}

function ActivityFeed() {
  const events = [
    ["18:42:03", "SECTOR 2", "Surface moisture rising", "cyan"],
    ["18:41:28", "WEATHER", "Open-Meteo sync complete", "green"],
    ["18:40:55", "STRATEGY", "Intermediates crossover in 5 laps", "amber"],
    ["18:39:42", "SECTOR 1", "Slick window extended", "green"],
  ] as const;
  return <div className="feed-list">{events.map(([time, tag, text, tone]) => <div className="feed-row" key={`${time}-${tag}`}><span className="feed-time mono">{time}</span><span className={`feed-tag ${tone}`}>{tag}</span><span className="feed-text">{text}</span></div>)}</div>;
}

export default function Home() {
  const [activeSector, setActiveSector] = useState<Sector>(sectors[1]);
  const [liveReading, setLiveReading] = useState<Reading>(seedReadings[1]);
  const [lastSync, setLastSync] = useState(formatTime());
  const [tick, setTick] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [scenario, setScenario] = useState<Scenario>("dry race");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLap, setSimLap] = useState(0);
  const [simResult, setSimResult] = useState<Array<{ lap: number; saturation: number; tireStrategy: string; pitWindowLap: number; slopeDesc: string }>>([]);
  const [showVideoSampler, setShowVideoSampler] = useState(false);
  const [judgeMode, setJudgeMode] = useState(() => isJudgeModeRequested(window.location.search));
  const fileInput = useRef<HTMLInputElement>(null);
  const simulationTimers = useRef<number[]>([]);

  const sectorsQuery = trpc.telemetry.sectors.useQuery(undefined, { retry: false });
  const weatherQuery = trpc.telemetry.weather.useQuery(undefined, { retry: false, refetchInterval: 120_000 });
  const utils = trpc.useUtils();
  const analyzeMutation = trpc.telemetry.analyze.useMutation({ onSuccess: (data, variables) => { setLiveReading({ ...data.result, ...data.weather, tireStrategy: data.trend.tireStrategy, pitWindowLap: data.trend.pitWindowLap, slope: data.trend.slopeDesc, sectorId: variables.sectorId as Sector, createdAt: new Date() } as Reading); void utils.telemetry.history.invalidate(); setLastSync(formatTime()); toast.success(`Analysis complete · ${data.result.condition}`); }, onError: (error) => toast.error(error.message || "Analysis failed") });
  const historyQuery = trpc.telemetry.history.useQuery(undefined, { retry: false });
  const simulationQuery = trpc.telemetry.simulate.useQuery({ scenario }, { enabled: false, retry: false });
  const exportQuery = trpc.telemetry.exportCsv.useQuery(undefined, { enabled: false, retry: false });

  useEffect(() => {
    const id = window.setInterval(() => setTick(v => v + 1), 5000);
    return () => {
      window.clearInterval(id);
      simulationTimers.current.forEach(window.clearTimeout);
    };
  }, []);
  useEffect(() => {
    publishJudgeMode(window, judgeMode);
    return () => { publishJudgeMode(window, false); };
  }, [judgeMode]);
  const livePulse = Math.sin(tick / 2) * 0.7;
  const temp = weatherQuery.data?.temp ?? liveReading.temp;
  const humidity = weatherQuery.data?.humidity ?? liveReading.humidity;
  const wind = weatherQuery.data?.windSpeed ?? liveReading.windSpeed;
  const sectorOptions: readonly Sector[] = sectorsQuery.data?.map((item) => item.id as Sector) ?? sectors;

  const chartData = useMemo(() => trendData.map((row, index) => ({ ...row, sector2: Math.max(0, row.sector2 + Math.round(livePulse * (index / 2))) })), [livePulse]);
  const heatmapReadings = useMemo(() => seedReadings.map((reading) => reading.sectorId === liveReading.sectorId ? liveReading : reading), [liveReading]);
  const activeStrategy = liveReading.tireStrategy as typeof strategies[number];
  const historyRows = historyQuery.data ?? [];
  const riskCount = historyRows.filter((row) => row.condition === "Wet" || row.condition === "Damp").length;
  const confidenceLow = liveReading.confidence < 75;
  const statusTone = liveReading.condition === "Wet" ? "red" : liveReading.condition === "Damp" ? "amber" : liveReading.condition === "Drying" ? "cyan" : "green";

  const processFile = (file?: File) => {
    if (!file) return;
    const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!supportedTypes.includes(file.type)) { toast.error("Use a JPG, PNG, WebP, or GIF track image"); return; }
    if (file.size > 8_000_000) { toast.error("Image must be 8 MB or smaller"); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.onerror = () => toast.error("The selected image could not be read");
    reader.readAsDataURL(file);
  };

  const analyzeImage = () => {
    if (!preview) { fileInput.current?.click(); return; }
    analyzeMutation.mutate({ imageBase64: preview, mimeType: (preview.split(";")[0].replace("data:", "") || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif", sectorId: activeSector, weather: { temp, humidity, windSpeed: wind } });
  };

  const startSimulation = async () => {
    simulationTimers.current.forEach(window.clearTimeout);
    simulationTimers.current = [];
    setIsSimulating(true); setSimLap(0); setSimResult([]);
    try {
      const result = await simulationQuery.refetch();
      const laps = result.data ?? [];
      if (laps.length !== 4) throw new Error("Simulator did not return a 4-lap scenario");
      simulationTimers.current = laps.map((lap, index) => window.setTimeout(() => {
        setSimLap(index + 1);
        setSimResult(laps.slice(0, index + 1));
        if (index === laps.length - 1) {
          setIsSimulating(false);
          toast.success("4-lap simulation complete");
        }
      }, index * 700));
    } catch (error) {
      setIsSimulating(false);
      toast.error(error instanceof Error ? error.message : "Simulation failed");
    }
  };

  const downloadCsv = async () => {
    try {
      const result = await exportQuery.refetch();
      if (!result.data) { toast.info("No saved telemetry yet"); return; }
      const blob = new Blob([result.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tracksense-telemetry.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "CSV export failed");
    }
  };
  const printDebrief = () => window.print();

  return <div className={`command-page ${judgeMode ? "judge-mode" : ""}`}>
    <div className="judge-control-row"><Button variant="outline" className={`judge-button ${judgeMode ? "active" : ""}`} onClick={() => setJudgeMode((current) => !current)}><Presentation className="mr-2 h-4 w-4" />{judgeMode ? "Exit judge mode" : "Start judge mode"}</Button><span className="mono">FOCUSED 90-SECOND DEMO FLOW</span></div>
    {judgeMode && <div className="judge-presentation-bar"><div><p className="eyebrow accent-text">JUDGE PRESENTATION MODE</p><strong>Camera frames → AI condition → moisture trend → tire call</strong></div><Button variant="outline" className="judge-exit" onClick={() => setJudgeMode(false)}><X className="mr-2 h-4 w-4" />Exit presentation</Button></div>}
    <header className="command-header"><div><p className="eyebrow accent-text">RACE ENGINEERING / SESSION 07</p><h1 className="display-title">Mission Control</h1><p className="header-subtitle">Live track intelligence & pit strategy for <span className="accent-text">Silverstone GP</span></p></div><div className="header-actions"><div className="session-chip"><span className="status-dot" />LIVE SESSION <span className="mono">/ 18:42:08</span></div><Button variant="outline" className="icon-button" onClick={() => { setLastSync(formatTime()); weatherQuery.refetch(); }} title="Sync weather"><RefreshCw className="h-4 w-4" /></Button><Button className="neon-button" onClick={() => document.getElementById("live-analysis")?.scrollIntoView({ behavior: "smooth" })}><ScanLine className="h-4 w-4 mr-2" />New analysis</Button></div></header>

    <section id="mission-control" className="section-block hero-grid"><div className="hero-copy"><div className="overline"><span className="red-line" /> LIVE TRACK STATE</div><div className="hero-condition"><span className={`condition-orb ${statusTone}`} /><div><h2>{liveReading.condition}</h2><p>Current surface classification <span className="mono accent-text">{liveReading.confidence}% confidence</span></p></div></div><div className="hero-alert">{confidenceLow ? <><AlertTriangle className="h-4 w-4" /><span>LOW CONFIDENCE FLAG · Manual track-side inspection recommended</span></> : <><ShieldCheck className="h-4 w-4" /><span>MODEL HEALTHY · Classifier confidence above 75% threshold</span></>}</div><div className="hero-stat-grid"><div><span className="hero-stat-label">SURFACE SCORE</span><strong>{String(liveReading.saturation).padStart(2, "0")}<small>%</small></strong><span className="trend-down"><ArrowDownRight className="h-3 w-3" /> {liveReading.slope}</span></div><div><span className="hero-stat-label">RECOMMENDED COMPOUND</span><strong className="compound-text">{activeStrategy}</strong><span className="hero-stat-note">Crossover window in <b>~{liveReading.pitWindowLap} laps</b></span></div></div><div className="hero-progress"><div className="progress-label"><span>Track evolution</span><span className="mono">LIVE / 5s</span></div><div className="progress-line"><span style={{ width: `${Math.max(12, 80 - (tick % 9))}%` }} /></div></div></div><div className="hero-map-panel"><CircuitMap activeSector={activeSector} onSelect={setActiveSector} /></div></section>
    <CircuitMoistureHeatmap readings={heatmapReadings} activeSector={activeSector} onSelect={setActiveSector} />
    {showVideoSampler && <section className="section-block command-card video-analysis-card"><VideoFrameAnalyzer onAnalyzeFrame={(imageBase64) => analyzeMutation.mutateAsync({ imageBase64, mimeType: "image/jpeg", sectorId: activeSector, weather: { temp, humidity, windSpeed: wind } })} onComplete={(sampleCount) => toast.success(`${sampleCount} video frames analyzed for ${activeSector}`)} /></section>}

    <section className="metrics-grid"><TelemetryCard label="AMBIENT TEMP" value={temp} meta="Open-Meteo · updated live" icon={Gauge} tone="green" /><TelemetryCard label="RELATIVE HUMIDITY" value={humidity} meta="Atmospheric moisture" icon={CloudRain} tone="cyan" /><TelemetryCard label="WIND SPEED" value={wind} meta="10m surface reading" icon={Wind} tone="amber" /><TelemetryCard label="ACTIVE SECTOR" value={activeSector.replace("Sector ", "S").replace(" (Turn 1–4)", "").replace(" (Chicane)", "").replace(" (Straight)", "")} meta="Tap circuit segment to switch" icon={Zap} tone="red" /></section>

    <section id="live-analysis" className="section-block split-grid"><div className="command-card analysis-card"><div className="card-heading"><div><p className="eyebrow">01 / LIVE ANALYSIS</p><h3>Surface scan</h3></div><StatusPill tone="cyan">CLAUDE VISION READY</StatusPill></div><div className={`drop-zone ${isDragging ? "dragging" : ""} ${preview ? "has-preview" : ""}`} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files?.[0]); }} onClick={() => fileInput.current?.click()}>{preview ? <><img src={preview} alt="Track surface preview" className="upload-preview" /><div className="preview-overlay"><Check className="h-5 w-5" /><span>{fileName}</span></div></> : <><div className="upload-icon"><UploadCloud className="h-6 w-6" /></div><p className="drop-title">Drop surface image here</p><p className="drop-sub">or click to browse · JPG, PNG · max 10MB</p></>}<input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => processFile(e.target.files?.[0])} /></div><div className="analysis-controls"><div><label>ANALYZE SECTOR</label><select value={activeSector} onChange={(e) => setActiveSector(e.target.value as Sector)} className="dark-select">{sectorOptions.map(s => <option key={s}>{s}</option>)}</select></div><Button onClick={analyzeImage} disabled={analyzeMutation.isPending} className="neon-button analysis-button">{analyzeMutation.isPending ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Classifying...</> : <><Sparkles className="h-4 w-4 mr-2" />Run AI classification</>}</Button></div><button type="button" className="video-launch" onClick={() => setShowVideoSampler((current) => !current)}><Video className="h-3.5 w-3.5" />{showVideoSampler ? "Close short-video sampler" : "Analyze a short video"}</button><div className="tech-note"><Info className="h-3.5 w-3.5" />MD5 cache enabled · local heuristic fallback armed · confidence flag threshold 75%</div></div><div className="command-card classification-card"><div className="card-heading"><div><p className="eyebrow">ANALYSIS OUTPUT</p><h3>Telemetry verdict</h3></div><span className="mono subtle-text">{lastSync}</span></div><div className="verdict-banner"><span className={`condition-badge ${statusTone}`}>{liveReading.condition}</span><div><p className="verdict-title">{liveReading.condition === "Drying" ? "Track is shedding moisture" : liveReading.condition === "Wet" ? "Wet line is dominant" : "Surface trend is stable"}</p><p className="verdict-copy">{confidenceLow ? "Verify with a manual visual inspection before committing the next compound." : "Classifier agrees with sector telemetry and current weather conditions."}</p></div></div><SaturationGauge value={liveReading.saturation} /><div className="confidence-meter"><div className="confidence-head"><span>MODEL CONFIDENCE</span><b className={confidenceLow ? "warn-text" : "accent-text"}>{liveReading.confidence}%</b></div><div className="confidence-bar"><span style={{ width: `${liveReading.confidence}%` }} className={confidenceLow ? "warn-fill" : ""} /></div><div className="confidence-foot"><span>0</span><span>75% gate</span><span>100</span></div></div><div className="source-line"><span className="status-dot" /> SOURCE: <b>{liveReading.source.toUpperCase()}</b><span className="source-spacer" /> <span className="mono">{activeSector}</span></div></div></section>

    <section id="sector-matrix" className="section-block command-card"><div className="card-heading"><div><p className="eyebrow">02 / SECTOR MATRIX</p><h3>Track-wide moisture telemetry</h3></div><div className="heading-actions"><StatusPill>4 SECTORS ONLINE</StatusPill><Button variant="outline" className="small-outline" onClick={() => toast.info("Sector matrix is synced to your telemetry session")}>Sync data <RefreshCw className="ml-2 h-3 w-3" /></Button></div></div><div className="sector-table"><div className="sector-row table-head"><span>SECTOR</span><span>CONDITION</span><span>SATURATION</span><span>MOISTURE TREND</span><span>COMPOUND</span><span>PIT WINDOW</span></div>{heatmapReadings.map((reading) => <button key={reading.sectorId} onClick={() => setActiveSector(reading.sectorId)} className={`sector-row ${activeSector === reading.sectorId ? "row-active" : ""}`}><span className="sector-name"><span className="sector-pulse" style={{ background: getHeatmapColor(reading.condition, reading.saturation) }} />{reading.sectorId}</span><span><span className={`mini-condition ${reading.condition.toLowerCase()}`}>{reading.condition}</span></span><span className="mono saturation-cell"><span className="mini-bar"><i style={{ width: `${reading.saturation}%`, background: getHeatmapColor(reading.condition, reading.saturation) }} /></span>{reading.saturation}%</span><span className={reading.slope.includes("Wetting") ? "warn-text" : "accent-text"}>{reading.slope.includes("Wetting") ? <ArrowUpRight className="h-3 w-3 inline mr-1" /> : <ArrowDownRight className="h-3 w-3 inline mr-1" />}{reading.slope}</span><span><b className="compound-label">{reading.tireStrategy}</b></span><span className="mono pit-window">L{String(reading.pitWindowLap).padStart(2, "0")} <ChevronRight className="inline h-3 w-3" /></span></button>)}</div></section>

    <section id="strategy-engine" className="section-block split-grid strategy-grid"><div className="command-card chart-card"><div className="card-heading"><div><p className="eyebrow">03 / MOISTURE EVOLUTION</p><h3>Track trend envelope</h3></div><div className="legend"><span><i className="legend-line green" />S1</span><span><i className="legend-line cyan" />S2</span><span><i className="legend-line amber" />S3</span><span><i className="legend-line red" />PIT</span></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}><defs><linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b7ff39" stopOpacity={0.22} /><stop offset="100%" stopColor="#b7ff39" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#ffffff" strokeOpacity={0.06} vertical={false} /><XAxis dataKey="lap" tick={{ fill: "#697385", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: "#697385", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} /><Tooltip contentStyle={{ background: "#0e131b", border: "1px solid rgba(183,255,57,.28)", borderRadius: 4, fontSize: 11 }} /><Area type="monotone" dataKey="sector1" stroke="#b7ff39" fill="url(#greenFill)" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="sector2" stroke="#57e9ff" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="sector3" stroke="#ffb14a" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="pit" stroke="#ff5e72" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer></div><div className="chart-footer"><span><i className="chart-dash" />Confidence band · 75–96%</span><span className="mono">8 LAPS OBSERVED</span></div></div><div className="command-card strategy-card"><div className="card-heading"><div><p className="eyebrow">04 / STRATEGY ENGINE</p><h3>Next pit call</h3></div><StatusPill tone="amber">DECISION WINDOW</StatusPill></div><div className="strategy-main"><div className="tire-icon"><span>{activeStrategy === "Full Wets" ? "W" : activeStrategy === "Intermediates" ? "I" : "S"}</span></div><div><p className="strategy-kicker">RECOMMENDATION</p><h4>{activeStrategy}</h4><p className="strategy-context">{liveReading.slope}</p></div></div><div className="pit-call"><div><span className="pit-label">OPTIMAL PIT WINDOW</span><strong>Lap {liveReading.pitWindowLap}</strong></div><div className="pit-countdown"><TimerReset className="h-4 w-4" /><span>+{Math.max(1, liveReading.pitWindowLap - 2)} to +{liveReading.pitWindowLap + 2}</span></div></div><div className="strategy-reason"><Sparkles className="h-4 w-4 accent-text" /><span>Surface delta and humidity converge on <b>{activeStrategy.toLowerCase()}</b>. Avoid an early stop until the crossover line clears.</span></div><Button className="full-button" onClick={() => toast.success(`Strategy locked: ${activeStrategy} / Lap ${liveReading.pitWindowLap}`)}>Lock strategy call <Flag className="ml-2 h-4 w-4" /></Button></div></section>

    <section className="section-block split-grid lower-grid"><div className="command-card simulator-card"><div className="card-heading"><div><p className="eyebrow">05 / RACE SIMULATOR</p><h3>Scenario replay</h3></div><span className="mono subtle-text">EXACTLY 4 LAPS</span></div><div className="scenario-tabs">{scenarios.map(item => <button key={item} className={scenario === item ? "active" : ""} onClick={() => setScenario(item)}>{item}</button>)}</div><div className="sim-visual"><div className="sim-laps">{[1, 2, 3, 4].map(lap => <div key={lap} className={`sim-lap ${simLap >= lap ? "complete" : ""} ${simLap === lap && isSimulating ? "current" : ""}`}><span>L{lap}</span><i /></div>)}</div><div className="sim-readout"><span className="eyebrow">{isSimulating ? "RUNNING SIMULATION" : simLap === 4 ? "SIMULATION COMPLETE" : "READY TO RUN"}</span><strong>{simLap || "—"}<small>/4</small></strong><span>laps processed</span></div></div>{simResult.length > 0 && <div className="sim-output">{simResult.map(row => <div key={row.lap}><span className="mono">L{row.lap}</span><span>{row.saturation}% moisture</span><b className="accent-text">{row.tireStrategy}</b><span className="mono">pit L{row.pitWindowLap}</span></div>)}</div>}<Button className="full-button" onClick={startSimulation} disabled={isSimulating}>{isSimulating ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Running {scenario}</> : <><Play className="mr-2 h-4 w-4" />Run {scenario} simulation</>}</Button></div><div className="command-card feed-card"><div className="card-heading"><div><p className="eyebrow">06 / EVENT STREAM</p><h3>Race control feed</h3></div><span className="live-text"><span className="status-dot" />LIVE</span></div><ActivityFeed /><div className="feed-footer"><span>Last sync <b>{lastSync}</b></span><button onClick={() => toast.info("All systems nominal")}>View all events <ChevronRight className="inline h-3 w-3" /></button></div></div></section>

    <section id="history" className="section-block command-card history-card"><div className="card-heading"><div><p className="eyebrow">07 / HISTORY & DEBRIEF</p><h3>Session log</h3></div><div className="heading-actions"><Button variant="outline" className="small-outline" onClick={downloadCsv}><Download className="mr-2 h-3 w-3" />Export CSV</Button><Button variant="outline" className="small-outline" onClick={printDebrief}><Printer className="mr-2 h-3 w-3" />Print debrief</Button></div></div><div className="history-strip"><div><span className="history-value">{historyRows.length}</span><span className="history-label">SAVED READINGS</span></div><div><span className="history-value">{riskCount}</span><span className="history-label">RISK FLAGS</span></div><div><span className="history-value">{historyRows.length ? `${Math.round(historyRows.reduce((sum, row) => sum + row.confidence, 0) / historyRows.length)}%` : "—"}</span><span className="history-label">SESSION CONFIDENCE</span></div><div><span className="history-value">07</span><span className="history-label">SESSION ID</span></div></div><div className="history-table">{historyQuery.isLoading ? <div className="history-empty"><RefreshCw className="h-4 w-4 animate-spin" /> Loading saved telemetry…</div> : historyRows.length === 0 ? <div className="history-empty"><Info className="h-4 w-4" /> No saved readings yet. Run an AI classification to create the first session log.</div> : historyRows.map((row) => <div className="history-row" key={row.id}><span className="mono subtle-text">{new Date(row.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><span>{row.sectorId}</span><span className={`mini-condition ${row.condition.toLowerCase()}`}>{row.condition}</span><span>{row.tireStrategy}</span><span className="mono">{row.confidence}% conf.</span><span className="accent-text">ARCHIVED</span></div>)}</div></section>

    <ChallengeDemoPanel liveReading={liveReading} onApplyStep={(step, index) => { setActiveSector(sectors[index]); setLiveReading({ condition: step.condition, confidence: step.confidence, saturation: step.saturation, tireStrategy: step.tireStrategy, pitWindowLap: step.pitWindowLap, slope: step.slope, temp, humidity, windSpeed: wind, sectorId: sectors[index], source: "guided-demo", createdAt: new Date() }); setLastSync(formatTime()); }} />
    <footer className="command-footer"><span><Gauge className="h-3.5 w-3.5" /> TRACKSENSE PRO <b>v0.8.0</b></span><span className="mono">OPEN-METEO LINKED · CLAUDE VISION READY · MD5 CACHE ON</span><span className="mono">UPTIME <b className="accent-text">99.98%</b></span></footer>
  </div>;
}
