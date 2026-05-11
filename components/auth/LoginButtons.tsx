"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function shouldUseRedirect() {
  if (typeof window === "undefined") return false;
  return window.location.hostname !== "localhost";
}

export function LoginButtons() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [showNicknameInput, setShowNicknameInput] = useState(false);
  const [redirectPending, setRedirectPending] = useState(false);

  async function upsertUser(uid: string, displayName: string, photoURL: string | null) {
    await setDoc(
      doc(db, COLLECTIONS.users, uid),
      { displayName, photoURL, createdAt: serverTimestamp() },
      { merge: true }
    );
  }

  // redirect 후 돌아왔을 때 결과 처리
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return;
        setRedirectPending(true);
        const { uid, displayName, photoURL } = result.user;
        try {
          await upsertUser(uid, displayName ?? "사용자", photoURL);
        } catch (e) {
          console.error("upsertUser 실패 (무시):", e);
        }
        router.replace("/");
      })
      .catch((e) => {
        console.error("[Auth] getRedirectResult 에러:", e);
        toast.error("구글 로그인에 실패했습니다.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      if (shouldUseRedirect()) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        const { uid, displayName, photoURL } = result.user;
        await upsertUser(uid, displayName ?? "사용자", photoURL);
        router.replace("/");
      }
    } catch (e) {
      toast.error("구글 로그인에 실패했습니다.");
      console.error(e);
    }
  }

  async function handleAnonymous() {
    if (!nickname.trim()) {
      toast.error("닉네임을 입력해주세요.");
      return;
    }
    try {
      const result = await signInAnonymously(auth);
      await updateProfile(result.user, { displayName: nickname.trim() });
      await result.user.getIdToken(true);
      await upsertUser(result.user.uid, nickname.trim(), null);
      router.replace("/");
    } catch (e) {
      toast.error("로그인에 실패했습니다.");
      console.error(e);
    }
  }

  if (redirectPending) return (
    <p className="text-sm text-zinc-400">로그인 중...</p>
  );

  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      <button
        type="button"
        onClick={handleGoogle}
        className="w-full h-12 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-900 hover:bg-zinc-50"
      >
        구글로 시작하기
      </button>

      {!showNicknameInput ? (
        <Button
          type="button"
          onClick={() => setShowNicknameInput(true)}
          variant="ghost"
          className="w-full h-12 text-base text-zinc-500"
        >
          닉네임만 입력하고 시작 (익명)
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <Input
            placeholder="닉네임 입력"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnonymous()}
            className="h-12 text-base"
            autoFocus
          />
          <Button type="button" onClick={handleAnonymous} disabled={!nickname.trim()} className="w-full h-12 text-base">
            시작하기
          </Button>
        </div>
      )}
    </div>
  );
}
