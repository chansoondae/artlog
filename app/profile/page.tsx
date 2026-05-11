"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.replace("/login"); return; }
    if (user?.displayName) setNickname(user.displayName);
  }, [user, loading, router]);

  async function handleSave() {
    if (!user || !nickname.trim()) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName: nickname.trim() });
      await setDoc(
        doc(db, COLLECTIONS.users, user.uid),
        { displayName: nickname.trim() },
        { merge: true }
      );
      toast.success("닉네임이 변경됐어요.");
    } catch (e) {
      toast.error("저장에 실패했습니다.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await auth.signOut();
    router.replace("/login");
  }

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center gap-2 px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <Link href="/">
          <Button variant="ghost" size="sm">← 홈</Button>
        </Link>
        <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">내 프로필</h1>
      </header>

      <main className="flex flex-col gap-6 px-4 py-6 max-w-md mx-auto w-full">
        {/* 프로필 요약 */}
        <div className="flex items-center gap-3 py-2">
          <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xl">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="프로필" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <span>{nickname.charAt(0) || "?"}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">{user.displayName ?? "사용자"}</p>
            <p className="text-xs text-zinc-400">{user.email ?? "익명"}</p>
          </div>
        </div>

        {/* 닉네임 변경 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">닉네임 변경</h2>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임 입력"
            className="h-12"
            maxLength={20}
          />
          <Button
            onClick={handleSave}
            disabled={saving || !nickname.trim() || nickname.trim() === user.displayName}
            className="h-12"
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
        </section>

        {/* 로그아웃 */}
        <section className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full h-12 text-zinc-500"
          >
            로그아웃
          </Button>
        </section>
      </main>
    </div>
  );
}
