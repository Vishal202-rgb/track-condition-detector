export const MAX_VIDEO_BYTES = 25_000_000;
export const MAX_VIDEO_SECONDS = 20;
export const MAX_VIDEO_SAMPLES = 4;

export function createSampleTimes(durationSeconds: number): number[] {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return [];

  const sampleCount = Math.min(MAX_VIDEO_SAMPLES, Math.max(1, Math.ceil(durationSeconds / 5)));
  return Array.from(
    { length: sampleCount },
    (_, index) => Number((((index + 1) / (sampleCount + 1)) * durationSeconds).toFixed(2)),
  );
}

export function validateVideoCandidate(sizeBytes: number, durationSeconds: number): string | null {
  if (sizeBytes <= 0) return "The selected video is empty";
  if (sizeBytes > MAX_VIDEO_BYTES) return "Video must be 25 MB or smaller";
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return "Video duration could not be determined";
  if (durationSeconds > MAX_VIDEO_SECONDS) return "Video must be 20 seconds or shorter";
  return null;
}
