import { LoginButtons } from "@/components/auth/LoginButtons";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black px-6">
      <div className="flex flex-col items-center gap-8 w-full max-w-xs">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            ArtLog
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            오늘의 인상작을 함께 공유하세요
          </p>
        </div>
        <LoginButtons />
      </div>
    </div>
  );
}
