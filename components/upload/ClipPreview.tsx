"use client";

import { useEffect, useRef } from "react";

interface ClipPreviewProps {
  blob: Blob;
}

export function ClipPreview({ blob }: ClipPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    if (videoRef.current) videoRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500 text-center">2초 클립 미리보기</p>
      <video
        ref={videoRef}
        controls
        playsInline
        loop
        className="w-full rounded-xl bg-black aspect-video"
      />
    </div>
  );
}
