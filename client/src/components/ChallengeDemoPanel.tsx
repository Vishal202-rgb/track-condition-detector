import { challengeDemoSteps, getDecisionEvidence, getRaceControlAlert, type ChallengeDemoStep } from "@shared/challengeDemo";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Play, RefreshCw, ScanLine, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type LiveDecision = {
  condition: string;
  confidence: number;
  saturation: number;
  tireStrategy: string;
  pitWindowLap: number;
  slope: string;
};

type ChallengeDemoPanelProps = {
  liveReading: LiveDecision;
  onApplyStep: (step: ChallengeDemoStep, index: number) => void;
};

export function ChallengeDemoPanel({ liveReading, onApplyStep }: ChallengeDemoPanelProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timers = useRef<number[]>([]);
  const condition = liveReading.condition as "Dry" | "Damp" | "Wet" | "Drying";
  const tireStrategy = liveReading.tireStrategy as "Slicks" | "Intermediates" | "Full Wets";
  const evidence = getDecisionEvidence(condition);
  const alert = getRaceControlAlert({ condition, tireStrategy, pitWindowLap: liveReading.pitWindowLap, slope: liveReading.slope });

  const applyStep = (index: number) => {
    const step = challengeDemoSteps[index];
    if (!step) return;
    setActiveStep(index + 1);
    onApplyStep(step, index);
  };

  const runDemo = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setActiveStep(0);
    setIsRunning(true);
    timers.current = challengeDemoSteps.map((_, index) => window.setTimeout(() => {
      applyStep(index);
      if (index === challengeDemoSteps.length - 1) {
        setIsRunning(false);
        toast.success("Challenge demo complete · Wet → Damp → Drying → Dry");
      }
    }, index * 1200));
  };

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  return <section className="section-block split-grid decision-demo-grid">
    <div className="command-card guided-demo-card">
      <div className="card-heading"><div><p className="eyebrow">05 / CHALLENGE DEMO</p><h3>Condition replay</h3></div><span className="status-pill status-cyan"><span className="status-dot" />WET → DRY</span></div>
      <div className="guided-demo-panel">
        <div className="guided-demo-head"><div><p className="guided-kicker">GUIDED JUDGE FLOW</p><p>Replay each required condition without replacing live image classification.</p></div><Button variant="outline" className="small-outline" onClick={runDemo} disabled={isRunning}>{isRunning ? <><RefreshCw className="mr-2 h-3 w-3 animate-spin" />Running</> : <><Play className="mr-2 h-3 w-3" />Run demo</>}</Button></div>
        <div className="demo-steps">{challengeDemoSteps.map((step, index) => <button key={step.condition} onClick={() => applyStep(index)} className={`${activeStep === index + 1 ? "active" : ""} ${step.condition.toLowerCase()}`}><span>{String(index + 1).padStart(2, "0")}</span><b>{step.condition}</b></button>)}</div>
        <p className="demo-call">{activeStep ? challengeDemoSteps[activeStep - 1]?.headline : "Start the replay to demonstrate Wet, Damp, Drying, and Dry outputs."}</p>
      </div>
      <div className="demo-trace"><ScanLine className="h-4 w-4" /><span>Frame-by-frame surface classification · trend update · tire-change call</span></div>
    </div>
    <div className="command-card decision-card">
      <div className="card-heading"><div><p className="eyebrow">06 / DECISION INTELLIGENCE</p><h3>Why this call</h3></div><Sparkles className="h-4 w-4 accent-text" /></div>
      <div className={`race-alert ${alert.tone}`}><div><span>{alert.label}</span><h4>{alert.title}</h4></div><p>{alert.message}</p></div>
      <div className="explainability-block"><div className="explainability-head"><Sparkles className="h-3.5 w-3.5" /><span>OPERATIONAL EVIDENCE</span></div><p>{evidence.summary}</p><div className="evidence-chips">{evidence.cues.map((cue) => <span key={cue}>{cue}</span>)}</div></div>
      <div className="decision-confidence"><span>CONFIDENCE GATE</span><b className={liveReading.confidence < 75 ? "warn-text" : "accent-text"}>{liveReading.confidence}%</b><span>{liveReading.confidence < 75 ? <><AlertTriangle className="h-3.5 w-3.5" />Manual check required</> : "Validated for strategy review"}</span></div>
    </div>
  </section>;
}
