import Link from "next/link";
import { CreateRoomForm } from "@/components/room/CreateRoomForm";
import { Button } from "@/components/ui/button";

export default function NewRoomPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center gap-2 px-4 h-14 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/">
          <Button variant="ghost" size="sm">← 뒤로</Button>
        </Link>
        <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">방 만들기</h1>
      </header>
      <main className="flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-md">
          <CreateRoomForm />
        </div>
      </main>
    </div>
  );
}
