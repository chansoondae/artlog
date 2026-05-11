"use client";

import { useEffect, useRef, useState } from "react";
import { trimTo2Seconds } from "@/lib/ffmpeg/trim";
import { getFFmpeg } from "@/lib/ffmpeg/loader";
import { transcodeToH264 } from "@/lib/transcode";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VideoTrimmerProps {
  file: File;
  onTrimmed: (blob: Blob) => void;
}

type Status = "ready" | "loading-ffmpeg" | "trimming" | "done";

export function VideoTrimmer({ file, onTrimmed }: VideoTrimmerProps) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [startSec, setStartSec] = useState(0);
  const [status, setStatus] = useState<Status>("ready");
  const [progress, setProgress] = useState(0);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (previewRef.current) previewRef.current.src = url;

    const video = document.createElement("video");
    video.src = url;
    video.onloadedmetadata = () => setDuration(video.duration);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // 슬라이더 이동 시 미리보기 시점 이동
  useEffect(() => {
    if (previewRef.current && duration > 0) {
      previewRef.current.currentTime = startSec;
    }
  }, [startSec, duration]);

  async function handleTrim() {
    setProgress(0);
    setErrorDetail(null);
    setStatus("loading-ffmpeg");

    // ffmpeg 로그 수집
    let lastLog = "";
    const ff = await getFFmpeg();
    const logHandler = ({ message }: { message: string }) => { lastLog = message; };
    ff.on("log", logHandler);

    setStatus("trimming");
    try {
      const blob = await trimTo2Seconds(file, startSec, (p) => setProgress(p));
      ff.off("log", logHandler);
      setStatus("done");
      setProgress(100);
      onTrimmed(blob);
    } catch (e) {
      ff.off("log", logHandler);
      console.error(e);

      // HEVC 등 미지원 코덱 → Canvas 폴백
      const isCodecError = lastLog.includes("hevc") || lastLog.includes("hvc1")
        || lastLog.includes("Invalid argument") || lastLog.includes("Decoder");

      if (isCodecError) {
        setErrorDetail("HEVC 영상 감지 — 브라우저 방식으로 재시도 중...");
        try {
          const blob = await transcodeToH264(file, startSec, 2, (p) => setProgress(p));
          setErrorDetail(null);
          setStatus("done");
          setProgress(100);
          onTrimmed(blob);
          return;
        } catch (e2) {
          console.error(e2);
          setErrorDetail("변환에 실패했습니다. 설정 → 카메라 → 포맷을 '가장 호환성 높은'으로 변경 후 촬영해주세요.");
        }
      } else {
        setErrorDetail(lastLog || String(e));
      }

      setStatus("ready");
      toast.error("트리밍에 실패했습니다.");
    }
  }

  const busy = status === "loading-ffmpeg" || status === "trimming";

  return (
    <div className="flex flex-col gap-4">
      <video
        ref={previewRef}
        muted
        playsInline
        controls
        className="w-full rounded-xl bg-black aspect-[9/16]"
      />

      {duration > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>시작: {startSec.toFixed(1)}초</span>
            <span>끝: {Math.min(startSec + 2, duration).toFixed(1)}초</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, duration - 2)}
            step={0.1}
            value={startSec}
            onChange={(e) => setStartSec(Number(e.target.value))}
            disabled={busy}
            className="w-full accent-zinc-900 dark:accent-zinc-50"
          />
        </div>
      )}

      {busy && (
        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
          <div
            className="bg-zinc-900 dark:bg-zinc-50 h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {errorDetail && (
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2 leading-relaxed">
          {errorDetail}
        </div>
      )}

      <Button onClick={handleTrim} disabled={busy || duration === 0} className="h-12 text-base">
        {status === "loading-ffmpeg"
          ? "ffmpeg 로딩 중..."
          : status === "trimming"
          ? `처리 중... ${progress}%`
          : status === "done"
          ? "✓ 완료 — 다시 자르기"
          : "✂️ 2초 잘라내기"}
      </Button>
    </div>
  );
}
