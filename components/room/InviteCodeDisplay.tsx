"use client";

import { toast } from "sonner";

interface InviteCodeDisplayProps {
  code: string;
}

export function InviteCodeDisplay({ code }: InviteCodeDisplayProps) {
  function handleCopy() {
    navigator.clipboard.writeText(code);
    toast.success("초대 코드가 복사됐어요!");
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-zinc-500">초대 코드</p>
      <button
        onClick={handleCopy}
        className="font-mono text-3xl font-bold tracking-widest text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 px-6 py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        {code}
      </button>
      <p className="text-xs text-zinc-400">탭하면 복사됩니다</p>
    </div>
  );
}
