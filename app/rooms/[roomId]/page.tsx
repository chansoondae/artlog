"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/lib/constants";
import { useAuth } from "@/components/auth/AuthProvider";
import { InviteCodeDisplay } from "@/components/room/InviteCodeDisplay";
import { DayFeed } from "@/components/feed/DayFeed";
import { Room, Log } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }

    getDoc(doc(db, COLLECTIONS.rooms, roomId)).then((snap) => {
      if (!snap.exists() || !snap.data().memberIds.includes(user.uid)) {
        router.replace("/");
        return;
      }
      setRoom({ id: snap.id, ...snap.data() } as Room);
      setFetching(false);
    });
  }, [loading, user, roomId, router]);

  useEffect(() => {
    if (!user || fetching) return;
    const q = query(
      collection(db, COLLECTIONS.rooms, roomId, SUBCOLLECTIONS.logs),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Log)));
    });
  }, [user, roomId, fetching]);

  if (loading || fetching || !room) return null;

  const grouped = logs.reduce<Record<string, Log[]>>((acc, log) => {
    if (!acc[log.dayKey]) acc[log.dayKey] = [];
    acc[log.dayKey].push(log);
    return acc;
  }, {});
  const sortedDayKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <Link href="/">
          <Button variant="ghost" size="sm">← 홈</Button>
        </Link>
        <h1 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate max-w-[140px] text-sm">
          {room.name}
        </h1>
        <div className="flex items-center gap-1">
          <Link href={`/rooms/${roomId}/settings`}>
            <Button variant="ghost" size="sm">설정</Button>
          </Link>
          <Link href={`/rooms/${roomId}/upload`}>
            <Button size="sm">+ 올리기</Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-col gap-8 px-4 py-6 max-w-md mx-auto w-full">
        <div className="flex flex-col items-center gap-2 py-2">
          <InviteCodeDisplay code={room.inviteCode} />
          <p className="text-xs text-zinc-400">멤버 {room.memberIds.length}/{room.maxMembers}명</p>
        </div>

        {sortedDayKeys.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-4xl">🎨</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-300">아직 인상작이 없어요</p>
            <p className="text-sm text-zinc-400">
              오늘 가장 인상 깊었던 작품의<br />2초 영상을 올려보세요.
            </p>
            <Link href={`/rooms/${roomId}/upload`}>
              <Button className="mt-2">첫 인상작 올리기</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {sortedDayKeys.map((dayKey) => (
              <DayFeed key={dayKey} dayKey={dayKey} logs={grouped[dayKey]} roomId={roomId} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
