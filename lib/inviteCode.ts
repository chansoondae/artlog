import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 I, O, 0, 1 제외
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const q = query(
      collection(db, COLLECTIONS.rooms),
      where("inviteCode", "==", code)
    );
    const snap = await getDocs(q);
    if (snap.empty) return code;
  }
  throw new Error("초대 코드 생성에 실패했습니다. 다시 시도해주세요.");
}
