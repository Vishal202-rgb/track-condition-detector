export const JUDGE_MODE_QUERY_KEY = "judge";
export const JUDGE_MODE_EVENT = "tracksense:judge-mode";

export function isJudgeModeRequested(search: string): boolean {
  return new URLSearchParams(search).get(JUDGE_MODE_QUERY_KEY) === "1";
}

export function publishJudgeMode(target: EventTarget, enabled: boolean): void {
  target.dispatchEvent(new CustomEvent<boolean>(JUDGE_MODE_EVENT, { detail: enabled }));
}

export function subscribeToJudgeMode(target: EventTarget, onChange: (enabled: boolean) => void): () => void {
  const handleJudgeMode = (event: Event) => {
    const enabled = (event as CustomEvent<unknown>).detail;
    if (typeof enabled === "boolean") onChange(enabled);
  };
  target.addEventListener(JUDGE_MODE_EVENT, handleJudgeMode);
  return () => target.removeEventListener(JUDGE_MODE_EVENT, handleJudgeMode);
}
