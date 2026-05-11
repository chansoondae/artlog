"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { useAuth } from "@/components/auth/AuthProvider";
import { VideoPicker } from "@/components/upload/VideoPicker";
import { VideoTrimmer } from "@/components/upload/VideoTrimmer";
import { UploadForm } from "@/components/upload/UploadForm";
import { Room } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Step = "pick" | "trim" | "upload";

const STEP_LABELS: Record<Step, string> = {
  pick: "영상 선택",
  trim: "2초 자르기",
  upload: "정보 입력",
};

export default function UploadPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [step, setStep] = useState<Step>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [clipBlob, setClipBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }

    getDoc(doc(db, COLLECTIONS.rooms, roomId)).then((snap) => {
      if (!snap.exists() || !snap.data().memberIds.includes(user.uid)) {
        router.replace("/");
        return;
      }
      setRoom({ id: snap.id, ...snap.data() } as Room);
    });
  }, [loading, user, roomId, router]);

  // 페이지 이탈 방지 (trim/upload 단계)
  useEffect(() => {
    if (step === "pick") return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [step]);

  if (loading || !room) return null;

  const steps: Step[] = ["pick", "trim", "upload"];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center gap-2 px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {step === "pick" ? (
          <Link href={`/rooms/${roomId}`}>
            <Button variant="ghost" size="sm">← 뒤로</Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (step === "trim") { setStep("pick"); setFile(null); }
              if (step === "upload") { setStep("trim"); setClipBlob(null); }
            }}
          >
            ← 뒤로
          </Button>
        )}
        <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">인상작 올리기</h1>
      </header>

      {/* 스텝 인디케이터 */}
      <div className="flex items-center px-4 py-3 gap-2 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold transition-colors ${
              i < stepIndex
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : i === stepIndex
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 ring-2 ring-zinc-300"
                : "bg-zinc-200 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500"
            }`}>
              {i < stepIndex ? "✓" : i + 1}
            </div>
            <span className={`text-xs ${i === stepIndex ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-400"}`}>
              {STEP_LABELS[s]}
            </span>
            {i < steps.length - 1 && <span className="text-zinc-300 dark:text-zinc-700 text-xs">›</span>}
          </div>
        ))}
      </div>

      <main className="flex flex-col px-4 py-6 max-w-md mx-auto w-full">
        {step === "pick" && (
          <VideoPicker
            onSelect={(f) => {
              setFile(f);
              setStep("trim");
            }}
          />
        )}

        {step === "trim" && file && (
          <VideoTrimmer
            file={file}
            onTrimmed={(blob) => {
              setClipBlob(blob);
              setStep("upload");
            }}
          />
        )}

        {step === "upload" && clipBlob && (
          <UploadForm
            roomId={roomId}
            clipBlob={clipBlob}
            defaultVenue={room.defaultVenue}
            onBack={() => {
              setClipBlob(null);
              setStep("trim");
            }}
          />
        )}
      </main>
    </div>
  );
}
