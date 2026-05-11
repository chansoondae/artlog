"use client";

import { useEffect, useRef, useState } from "react";
import { mergeClips } from "@/lib/ffmpeg/merge";
import { Log } from "@/lib/types";
import { toast } from "sonner";

interface MergeButtonProps {
  logs: Log[];
  dayKey: string;
}

type Status = "idle" | "loading" | "merging" | "done";

export function MergeButton({ logs, dayKey }: MergeButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (resultUrl && videoRef.current) {
      videoRef.current.src = resultUrl;
    }
  }, [resultUrl]);

  // 컴포넌트 언마운트 시 URL 해제
  useEffect(() => {
    return () => { if (resultUrl) URL.revokeObjectURL(resultUrl); };
  }, [resultUrl]);

  async function handleMerge() {
    setProgress(0);
    setResultUrl(null);
    setStatus("loading");

    try {
      const blob = await mergeClips(
        logs.map((l) => ({ url: l.videoUrl, authorName: l.authorName })),
        (p) => {
          setStatus("merging");
          setProgress(p);
        }
      );
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStatus("done");
      setProgress(100);
    } catch (e) {
      console.error(e);
      toast.error("영상 합치기에 실패했습니다.");
      setStatus("idle");
    }
  }

  function handleDownload() {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `artlog_${dayKey}.mp4`;
    a.click();
  }

  const busy = status === "loading" || status === "merging";

  return (
    <div className="flex flex-col gap-3">
      {status !== "done" && (
        <button
          type="button"
          onClick={handleMerge}
          disabled={busy || logs.length < 2}
          className="w-full h-12 rounded-xl text-sm font-semibold transition-colors bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "ffmpeg 로딩 중..." :
           status === "merging" ? `합치는 중... ${progress}%` :
           "🎞 분할 화면 영상으로 합치기"}
        </button>
      )}

      {busy && (
        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1">
          <div
            className="bg-zinc-900 dark:bg-zinc-50 h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {status === "done" && resultUrl && (
        <div className="flex flex-col gap-2">
          <video
            ref={videoRef}
            controls
            playsInline
            loop
            className="w-full rounded-xl bg-black"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 h-11 rounded-xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 text-sm font-semibold hover:opacity-90"
            >
              ↓ 다운로드
            </button>
            <button
              type="button"
              onClick={() => { setStatus("idle"); setResultUrl(null); }}
              className="h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              다시
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
