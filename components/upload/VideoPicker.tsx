"use client";

interface VideoPickerProps {
  onSelect: (file: File) => void;
}

export function VideoPicker({ onSelect }: VideoPickerProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onSelect(f);
  }

  return (
    <label className="flex flex-col items-center justify-center gap-3 w-full aspect-video rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
      <span className="text-4xl">🎬</span>
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        영상 선택하기
      </span>
      <span className="text-xs text-zinc-400">갤러리에서 영상을 선택하세요</span>
      <input
        type="file"
        accept="video/*"
        onChange={handleChange}
        className="hidden"
      />
    </label>
  );
}
