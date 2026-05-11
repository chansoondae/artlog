"use client";

import { useEffect, useRef, useState } from "react";
import { trimTo2Seconds } from "@/lib/ffmpeg/trim";
import { getFFmpeg } from "@/lib/ffmpeg/loader";
import { Button } from "@/components/ui/button";

type Status = "idle" | "loading-ffmpeg" | "ready" | "trimming" | "done";

export default function TrimDevPage() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [startSec, setStartSec] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const resultRef = useRef<HTMLVideoElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResultUrl(null);
    setStartSec(0);
    setStatus("idle");

    const url = URL.createObjectURL(f);
    const video = document.createElement("video");
    video.src = url;
    video.onloadedmetadata = () => {
      setDuration(video.duration);
      URL.revokeObjectURL(url);
    };

    if (previewRef.current) {
      previewRef.current.src = URL.createObjectURL(f);
    }
  }

  async function handleTrim() {
    if (!file) return;
    setProgress(0);
    setResultUrl(null);

    setStatus("loading-ffmpeg");
    await getFFmpeg();

    setStatus("trimming");
    try {
      const blob = await trimTo2Seconds(file, startSec, (p) => setProgress(p));
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStatus("done");
      setProgress(100);
    } catch (e) {
      console.error(e);
      setStatus("ready");
      alert("트리밍에 실패했습니다. 콘솔을 확인해주세요.");
    }
  }

  useEffect(() => {
    if (resultUrl && resultRef.current) {
      resultRef.current.src = resultUrl;
    }
  }, [resultUrl]);

  const statusLabel: Record<Status, string> = {
    idle: "영상을 선택해주세요",
    "loading-ffmpeg": "ffmpeg 로딩 중... (첫 실행 시 ~30MB 다운로드)",
    ready: "시작 시점을 선택하고 잘라내기를 눌러주세요",
    trimming: `처리 중... ${progress}%`,
    done: "완료!",
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-bold">ffmpeg.wasm 트리밍 테스트</h1>

      <p className="text-sm text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-2">
        {statusLabel[status]}
      </p>

      <div>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="text-sm"
        />
      </div>

      {file && (
        <>
          <video
            ref={previewRef}
            controls
            muted
            playsInline
            className="w-full rounded-xl bg-black aspect-video"
          />

          {duration > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                시작 시점: <span className="font-mono">{startSec.toFixed(1)}초</span>
                <span className="text-zinc-400"> (끝: {(startSec + 2).toFixed(1)}초)</span>
              </label>
              <input
                type="range"
                min={0}
                max={Math.max(0, duration - 2)}
                step={0.1}
                value={startSec}
                onChange={(e) => setStartSec(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <Button
            onClick={handleTrim}
            disabled={status === "loading-ffmpeg" || status === "trimming"}
            className="h-12 text-base"
          >
            {status === "trimming" ? `처리 중... ${progress}%` : "✂️ 2초 잘라내기"}
          </Button>
        </>
      )}

      {resultUrl && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">결과 (2초 클립)</h2>
          <video
            ref={resultRef}
            controls
            playsInline
            loop
            className="w-full rounded-xl bg-black aspect-video"
          />
          <a
            href={resultUrl}
            download="clip_2sec.mp4"
            className="text-center text-sm text-blue-600 underline"
          >
            다운로드
          </a>
        </div>
      )}
    </div>
  );
}
