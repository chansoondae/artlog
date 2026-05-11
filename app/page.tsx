"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoomCard } from "@/components/room/RoomCard";
import { Room } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, COLLECTIONS.rooms),
      where("memberIds", "array-contains", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Room)));
    });
    return unsub;
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">ArtLog</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 hidden sm:block">{user.displayName}</span>
          <Button variant="ghost" size="sm" onClick={() => signOut(auth).then(() => router.replace("/login"))}>
            로그아웃
          </Button>
        </div>
      </header>

      <main className="flex flex-col gap-6 px-4 py-6 max-w-md mx-auto w-full">
        <div className="flex gap-2">
          <Link href="/rooms/new" className="flex-1">
            <Button className="w-full h-12">+ 방 만들기</Button>
          </Link>
          <Link href="/rooms/join" className="flex-1">
            <Button variant="outline" className="w-full h-12">코드로 참여</Button>
          </Link>
        </div>

        {rooms.length === 0 ? (
          <p className="text-center text-zinc-400 text-sm py-8">
            참여한 방이 없어요.<br />방을 만들거나 초대 코드로 참여해보세요.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-zinc-500">내 방</h2>
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
