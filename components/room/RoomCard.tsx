import Link from "next/link";
import { Room } from "@/lib/types";

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="flex flex-col gap-1 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
    >
      <span className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
        {room.name}
      </span>
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span>{room.memberIds.length}/{room.maxMembers}명</span>
        {room.defaultVenue && (
          <>
            <span>·</span>
            <span className="truncate">{room.defaultVenue}</span>
          </>
        )}
      </div>
    </Link>
  );
}
