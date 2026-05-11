"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/lib/constants";
import { useAuth } from "@/components/auth/AuthProvider";
import { Room, RoomMember } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

export default function RoomSettingsPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<(RoomMember & { uid: string })[]>([]);
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }

    getDoc(doc(db, COLLECTIONS.rooms, roomId)).then(async (snap) => {
      if (!snap.exists() || !snap.data().memberIds.includes(user.uid)) {
        router.replace("/");
        return;
      }
      const data = { id: snap.id, ...snap.data() } as Room;
      setRoom(data);
      setName(data.name);
      setVenue(data.defaultVenue ?? "");

      const membersSnap = await getDocs(
        collection(db, COLLECTIONS.rooms, roomId, SUBCOLLECTIONS.members)
      );
      setMembers(
        membersSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as RoomMember & { uid: string }))
      );
    });
  }, [loading, user, roomId, router]);

  const isOwner = room?.ownerId === user?.uid;

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.rooms, roomId), {
        name: name.trim(),
        defaultVenue: venue.trim() || null,
      });
      toast.success("저장됐어요.");
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLeave() {
    if (!user || !room) return;
    if (!confirm("방에서 나가시겠어요?")) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.rooms, roomId), {
        memberIds: room.memberIds.filter((id) => id !== user.uid),
      });
      await deleteDoc(
        doc(db, COLLECTIONS.rooms, roomId, SUBCOLLECTIONS.members, user.uid)
      );
      router.replace("/");
    } catch {
      toast.error("나가기에 실패했습니다.");
    }
  }

  async function handleDeleteRoom() {
    if (!confirm("방을 삭제하면 복구할 수 없어요. 정말 삭제할까요?")) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, COLLECTIONS.rooms, roomId));
      toast.success("방이 삭제됐어요.");
      router.replace("/");
    } catch {
      toast.error("삭제에 실패했습니다.");
      setDeleting(false);
    }
  }

  if (loading || !room) return null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center gap-2 px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <Link href={`/rooms/${roomId}`}>
          <Button variant="ghost" size="sm">← 뒤로</Button>
        </Link>
        <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">방 설정</h1>
      </header>

      <main className="flex flex-col gap-8 px-4 py-6 max-w-md mx-auto w-full">
        {/* 방 정보 수정 (owner만) */}
        {isOwner && (
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">방 정보</h2>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-zinc-600 dark:text-zinc-400">방 이름</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-zinc-600 dark:text-zinc-400">기본 장소</label>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="예: MMCA 서울"
                className="h-12"
              />
            </div>
            <Button onClick={handleSave} disabled={saving || !name.trim()} className="h-12">
              {saving ? "저장 중..." : "저장"}
            </Button>
          </section>
        )}

        {/* 멤버 목록 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            멤버 ({members.length}/{room.maxMembers})
          </h2>
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <div
                key={m.uid}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {m.displayName}
                  </span>
                  {m.role === "owner" && (
                    <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                      방장
                    </span>
                  )}
                  {m.uid === user?.uid && (
                    <span className="text-xs text-zinc-400">(나)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 나가기 / 방 삭제 */}
        <section className="flex flex-col gap-3">
          {!isOwner && (
            <Button variant="outline" onClick={handleLeave} className="h-12 text-red-500 border-red-200 hover:bg-red-50">
              방에서 나가기
            </Button>
          )}
          {isOwner && (
            <Button
              variant="outline"
              onClick={handleDeleteRoom}
              disabled={deleting}
              className="h-12 text-red-500 border-red-200 hover:bg-red-50"
            >
              {deleting ? "삭제 중..." : "방 삭제"}
            </Button>
          )}
        </section>
      </main>
    </div>
  );
}
