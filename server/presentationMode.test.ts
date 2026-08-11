import { describe, expect, it, vi } from "vitest";
import { JUDGE_MODE_EVENT, JUDGE_MODE_QUERY_KEY, isJudgeModeRequested, publishJudgeMode, subscribeToJudgeMode } from "../shared/presentationMode";

describe("judge presentation mode", () => {
  it("enables the focused presentation view only when requested explicitly", () => {
    expect(JUDGE_MODE_QUERY_KEY).toBe("judge");
    expect(isJudgeModeRequested("?judge=1")).toBe(true);
    expect(isJudgeModeRequested("?judge=0")).toBe(false);
    expect(isJudgeModeRequested("?scenario=drying-track")).toBe(false);
  });

  it("propagates a Home toggle to the dashboard shell and unsubscribes cleanly", () => {
    const presentationChannel = new EventTarget();
    const receivedStates: boolean[] = [];
    const unsubscribe = subscribeToJudgeMode(presentationChannel, (enabled) => receivedStates.push(enabled));

    publishJudgeMode(presentationChannel, true);
    publishJudgeMode(presentationChannel, false);
    expect(receivedStates).toEqual([true, false]);

    unsubscribe();
    publishJudgeMode(presentationChannel, true);
    expect(receivedStates).toEqual([true, false]);
  });

  it("does not treat malformed judge-mode events as state changes", () => {
    const presentationChannel = new EventTarget();
    const onChange = vi.fn();
    const unsubscribe = subscribeToJudgeMode(presentationChannel, onChange);

    presentationChannel.dispatchEvent(new CustomEvent(JUDGE_MODE_EVENT, { detail: "enabled" }));
    expect(onChange).not.toHaveBeenCalled();
    unsubscribe();
  });
});
