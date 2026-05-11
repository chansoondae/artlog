"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { COLLECTIONS, SUBCOLLECTIONS, STORAGE_PATHS } from "@/lib/constants";
import { getDayKey } from "@/lib/dayKey";
import { extractThumbnail } from "@/lib/ffmpeg/thumbnail";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipPreview } from "./ClipPreview";
import { toast } from "sonner";

interface UploadFormProps {
  roomId: string;
  clipBlob: Blob;
  defaultVenue: string | null;
  onBack: () => void;
}

export function UploadForm({ roomId, clipBlob, defaultVenue, onBack }: UploadFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [artworkTitle, setArtworkTitle] = useState("");
  const [artworkArtist, setArtworkArtist] = useState("");
  const [venue, setVenue] = useState(defaultVenue ?? "");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !caption.trim()) return;
    setUploading(true);

    try {
      const dayKey = getDayKey();
      const logRef = doc(collection(db, COLLECTIONS.rooms, roomId, SUBCOLLECTIONS.logs));
      const logId = logRef.id;

      // 영상 업로드
      const videoPath = STORAGE_PATHS.clip(roomId, dayKey, logId);
      const videoRef = ref(storage, videoPath);
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(videoRef, clipBlob, { contentType: "video/mp4" });
        task.on("state_changed",
          (snap) => setUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 80)),
          reject,
          () => resolve()
        );
      });
      const videoUrl = await getDownloadURL(videoRef);

      // 썸네일 추출 & 업로드
      let thumbnailUrl: string | null = null;
      try {
        const thumbBlob = await extractThumbnail(clipBlob);
        const thumbPath = STORAGE_PATHS.thumb(roomId, dayKey, logId);
        const thumbRef = ref(storage, thumbPath);
        await uploadBytesResumable(thumbRef, thumbBlob, { contentType: "image/jpeg" });
        thumbnailUrl = await getDownloadURL(thumbRef);
      } catch {
        // 썸네일 실패해도 업로드는 계속
      }
      setUploadProgress(95);

      // Firestore 메타 저장
      await setDoc(logRef, {
        authorId: user.uid,
        authorName: user.displayName ?? "사용자",
        videoUrl,
        videoPath,
        thumbnailUrl,
        caption: caption.trim(),
        artworkTitle: artworkTitle.trim() || null,
        artworkArtist: artworkArtist.trim() || null,
        venue: venue.trim() || null,
        dayKey,
        duration: 2.0,
        createdAt: serverTimestamp(),
      });

      setUploadProgress(100);
      toast.success("업로드 완료!");
      router.push(`/rooms/${roomId}`);
    } catch (e) {
      toast.error("업로드에 실패했습니다.");
      console.error(e);
      setUploading(false);
      setUploadProgress(0);
    }
  }

  return (
    <form onSubmit={handleUpload} className="flex flex-col gap-5">
      <ClipPreview blob={clipBlob} />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          한 줄 감상 <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="예: 색이 너무 아름다웠다"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="h-12"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          작품명
        </label>
        <Input
          placeholder="예: For the Love of God"
          value={artworkTitle}
          onChange={(e) => setArtworkTitle(e.target.value)}
          className="h-12"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          작가
        </label>
        <Input
          placeholder="예: Damien Hirst"
          value={artworkArtist}
          onChange={(e) => setArtworkArtist(e.target.value)}
          className="h-12"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          장소
        </label>
        <Input
          placeholder="예: MMCA 서울"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="h-12"
        />
      </div>

      {uploading && (
        <div className="flex flex-col gap-1">
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
            <div
              className="bg-zinc-900 dark:bg-zinc-50 h-1.5 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400 text-center">{uploadProgress}%</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={uploading} className="flex-1 h-12">
          ← 다시 자르기
        </Button>
        <Button type="submit" disabled={uploading || !caption.trim()} className="flex-1 h-12 text-base">
          {uploading ? "업로드 중..." : "올리기"}
        </Button>
      </div>
    </form>
  );
}
