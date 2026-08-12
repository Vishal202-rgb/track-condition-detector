import { createSampleTimes, MAX_VIDEO_SECONDS, validateVideoCandidate } from "@shared/videoSampling";
import { FileVideo, LoaderCircle, Play, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

type VideoFrameAnalyzerProps = {
  onAnalyzeFrame: (imageBase64: string) => Promise<unknown>;
  onComplete: (sampleCount: number) => void;
};

const supportedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

function waitForSeek(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Frame extraction timed out"));
    }, 5000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("The video frame could not be decoded"));
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = Math.min(Math.max(time, 0), Math.max(0, video.duration - 0.01));
  });
}

function captureFrame(video: HTMLVideoElement): string {
  const sourceWidth = video.videoWidth || 1;
  const sourceHeight = video.videoHeight || 1;
  const scale = Math.min(1, 960 / sourceWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sourceWidth * scale);
  canvas.height = Math.round(sourceHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Frame canvas is unavailable");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function VideoFrameAnalyzer({ onAnalyzeFrame, onComplete }: VideoFrameAnalyzerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [duration, setDuration] = useState(0);
  const [isSampling, setIsSampling] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  const selectVideo = (file?: File) => {
    if (!file) return;
    if (!supportedVideoTypes.includes(file.type)) {
      toast.error("Use an MP4, WebM, or MOV track video");
      return;
    }
    if (file.size > 25_000_000) {
      toast.error("Video must be 25 MB or smaller");
      return;
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setDuration(0);
    setProgress(0);
  };

  const beginAnalysis = async () => {
    const video = videoRef.current;
    if (!video || !videoUrl) {
      inputRef.current?.click();
      return;
    }
    const validation = validateVideoCandidate(1, duration || video.duration);
    if (validation) {
      toast.error(validation);
      return;
    }
    const sampleTimes = createSampleTimes(duration || video.duration);
    if (!sampleTimes.length) {
      toast.error("No usable frames could be sampled from this video");
      return;
    }
    setIsSampling(true);
    setProgress(0);
    try {
      for (let index = 0; index < sampleTimes.length; index += 1) {
        await waitForSeek(video, sampleTimes[index]);
        await onAnalyzeFrame(captureFrame(video));
        setProgress(index + 1);
      }
      onComplete(sampleTimes.length);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Video frame analysis failed");
    } finally {
      setIsSampling(false);
    }
  };

  return <div className="video-sampler">
    <div className="video-sampler-head"><div><span className="eyebrow">SHORT VIDEO INPUT</span><p>Sample up to 4 frames across a {MAX_VIDEO_SECONDS}-second track clip.</p></div><FileVideo className="h-4 w-4" /></div>
    {videoUrl ? <video ref={videoRef} src={videoUrl} className="video-preview" muted playsInline controls onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} /> : <button type="button" className="video-drop" onClick={() => inputRef.current?.click()}><UploadCloud className="h-4 w-4" /><span>Choose MP4, WebM, or MOV</span><small>Maximum 25 MB · maximum 20 seconds</small></button>}
    <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(event) => selectVideo(event.target.files?.[0])} />
    {videoUrl && <div className="video-actions"><span className="mono">{fileName} {duration ? `· ${duration.toFixed(1)}s` : "· reading metadata"}</span><Button className="full-button video-run" disabled={isSampling || !duration} onClick={beginAnalysis}>{isSampling ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Analyzing {progress}/{createSampleTimes(duration).length}</> : <><Play className="mr-2 h-4 w-4" />Sample & analyze frames</>}</Button></div>}
  </div>;
}
