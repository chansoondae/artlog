"use client";

import { useState } from "react";
import { doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/lib/constants";
import { useAuth } from "@/components/auth/AuthProvider";
import { Log } from "@/lib/types";
import { toast } from "sonner";

interface LogCardProps {
  log: Log;
  roomId: string;
}

export function LogCard({ log, roomId }: LogCardProps) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const isOwn = user?.uid === log.authorId;

  async function handleDelete() {
    if (!confirm("이 로그를 삭제할까요?")) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, COLLECTIONS.rooms, roomId, SUBCOLLECTIONS.logs, log.id));
      // Storage 파일 삭제 (실패해도 무시)
      try { await deleteObject(ref(storage, log.videoPath)); } catch {}
    } catch {
      toast.error("삭제에 실패했습니다.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-2 py-2">
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
          {log.authorName}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{log.caption}</p>
        {(log.artworkTitle || log.artworkArtist) && (
          <p className="text-xs text-zinc-400">
            {[log.artworkTitle, log.artworkArtist].filter(Boolean).join(" — ")}
          </p>
        )}
        {log.venue && (
          <p className="text-xs text-zinc-400">📍 {log.venue}</p>
        )}
      </div>
      {isOwn && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 text-xs text-zinc-300 hover:text-red-400 transition-colors pt-0.5"
        >
          삭제
        </button>
      )}
    </div>
  );
}
