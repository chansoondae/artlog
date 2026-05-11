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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function LoginButtons() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [showNicknameInput, setShowNicknameInput] = useState(false);
  const [loading, setLoading] = useState(false);

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
        const { uid, displayName, photoURL } = result.user;
        try {
          await upsertUser(uid, displayName ?? "사용자", photoURL);
        } catch (e) {
          console.error("upsertUser 실패 (무시):", e);
        }
        router.replace("/");
      })
      .catch((e) => {
        console.error(e);
        toast.error("구글 로그인에 실패했습니다.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogle() {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      if (isMobile()) {
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
    } finally {
      setLoading(false);
    }
  }

  async function handleAnonymous() {
    if (!nickname.trim()) {
      toast.error("닉네임을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const result = await signInAnonymously(auth);
      await updateProfile(result.user, { displayName: nickname.trim() });
      await result.user.getIdToken(true); // 토큰 강제 갱신
      await upsertUser(result.user.uid, nickname.trim(), null);
      router.replace("/");
    } catch (e) {
      toast.error("로그인에 실패했습니다.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      <Button onClick={handleGoogle} disabled={loading} variant="outline" className="w-full h-12 text-base">
        {loading ? "로그인 중..." : "구글로 시작하기"}
      </Button>

      {!showNicknameInput ? (
        <Button
          onClick={() => setShowNicknameInput(true)}
          disabled={loading}
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
          <Button onClick={handleAnonymous} disabled={loading || !nickname.trim()} className="w-full h-12 text-base">
            {loading ? "로그인 중..." : "시작하기"}
          </Button>
        </div>
      )}
    </div>
  );
}
