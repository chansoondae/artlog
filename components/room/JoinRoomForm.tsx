"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/lib/constants";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function JoinRoomForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !code.trim()) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, COLLECTIONS.rooms),
        where("inviteCode", "==", code.trim().toUpperCase())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.error("초대 코드를 확인해주세요.");
        return;
      }

      const roomDoc = snap.docs[0];
      const room = roomDoc.data();
      const roomId = roomDoc.id;

      if (room.memberIds.includes(user.uid)) {
        router.push(`/rooms/${roomId}`);
        return;
      }

      if (room.memberIds.length >= room.maxMembers) {
        toast.error("방이 가득 찼습니다.");
        return;
      }

      await updateDoc(doc(db, COLLECTIONS.rooms, roomId), {
        memberIds: arrayUnion(user.uid),
      });

      await setDoc(
        doc(db, COLLECTIONS.rooms, roomId, SUBCOLLECTIONS.members, user.uid),
        {
          displayName: user.displayName ?? "사용자",
          photoURL: user.photoURL ?? null,
          joinedAt: serverTimestamp(),
          role: "member",
        }
      );

      router.push(`/rooms/${roomId}`);
    } catch (e) {
      toast.error("방 참여에 실패했습니다.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          초대 코드
        </label>
        <Input
          placeholder="6자리 코드 입력"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="h-12 text-center font-mono text-lg tracking-widest uppercase"
          maxLength={6}
          required
        />
      </div>
      <Button type="submit" disabled={loading || code.length !== 6} className="h-12 text-base">
        {loading ? "참여 중..." : "방 참여하기"}
      </Button>
    </form>
  );
}
