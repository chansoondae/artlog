"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/lib/constants";
import { createUniqueInviteCode } from "@/lib/inviteCode";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function CreateRoomForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [maxMembers, setMaxMembers] = useState(6);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setLoading(true);
    try {
      const inviteCode = await createUniqueInviteCode();
      const roomRef = doc(collection(db, COLLECTIONS.rooms));
      const roomId = roomRef.id;

      await setDoc(roomRef, {
        name: name.trim(),
        inviteCode,
        ownerId: user.uid,
        memberIds: [user.uid],
        maxMembers,
        dayStartHour: 4,
        defaultVenue: venue.trim() || null,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, COLLECTIONS.rooms, roomId, SUBCOLLECTIONS.members, user.uid),
        {
          displayName: user.displayName ?? "사용자",
          photoURL: user.photoURL ?? null,
          joinedAt: serverTimestamp(),
          role: "owner",
        }
      );

      router.push(`/rooms/${roomId}`);
    } catch (e) {
      toast.error("방 생성에 실패했습니다.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          방 이름 <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="예: 아트프렌즈 폴라미술관 0427"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          기본 장소 (선택)
        </label>
        <Input
          placeholder="예: MMCA 서울"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="h-12"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          최대 인원
        </label>
        <div className="flex gap-2">
          {[3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMaxMembers(n)}
              className={`flex-1 h-12 rounded-lg border text-sm font-medium transition-colors ${
                maxMembers === n
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {n}명
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={loading || !name.trim()} className="h-12 text-base mt-2">
        {loading ? "생성 중..." : "방 만들기"}
      </Button>
    </form>
  );
}
