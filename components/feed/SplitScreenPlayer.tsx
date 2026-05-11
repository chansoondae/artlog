"use client";

import { useRef, useState } from "react";
import { Log } from "@/lib/types";

interface SplitScreenPlayerProps {
  logs: Log[];
}

function getGridClass(n: number): string {
  if (n === 1) return "grid-cols-1";
  if (n === 2) return "grid-cols-2";
  if (n === 3) return "grid-cols-3";
  if (n === 4) return "grid-cols-2";
  return "grid-cols-3"; // 5~6
}

export function SplitScreenPlayer({ logs }: SplitScreenPlayerProps) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<number[]>([]);

  async function handlePlay() {
    const videos = videoRefs.current.filter(Boolean) as HTMLVideoElement[];
    videos.forEach((v) => { v.currentTime = 0; });

    try {
      await Promise.all(videos.map((v) => v.play()));
      setPlaying(true);

      // 2초 후 정지
      setTimeout(() => {
        videos.forEach((v) => v.pause());
        setPlaying(false);
      }, 2100);
    } catch (e) {
      console.error(e);
    }
  }

  const gridClass = getGridClass(logs.length);

  return (
    <div className="flex flex-col gap-3">
      <div className={`grid ${gridClass} gap-1 rounded-xl overflow-hidden bg-black`}>
        {logs.map((log, i) => (
          <div key={log.id} className="relative aspect-video bg-zinc-900">
            {error.includes(i) ? (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                재생 불가
              </div>
            ) : (
              <video
                ref={(el) => { videoRefs.current[i] = el; }}
                src={log.videoUrl}
                muted
                playsInline
                preload="auto"
                onError={() => setError((prev) => [...prev, i])}
                className="w-full h-full object-cover"
              />
            )}
            {/* 이름 오버레이 */}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-xs font-medium truncate">{log.authorName}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handlePlay}
        disabled={playing}
        className={`w-full h-12 rounded-xl text-sm font-semibold transition-colors ${
          playing
            ? "bg-zinc-200 text-zinc-400 dark:bg-zinc-700 cursor-not-allowed"
            : "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 hover:opacity-90"
        }`}
      >
        {playing ? "재생 중..." : "▶ 동시 재생"}
      </button>
    </div>
  );
}
