import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Log } from "@/lib/types";
import { SplitScreenPlayer } from "./SplitScreenPlayer";
import { LogCard } from "./LogCard";

interface DayFeedProps {
  dayKey: string;
  logs: Log[];
  roomId: string;
}

export function DayFeed({ dayKey, logs, roomId }: DayFeedProps) {
  const dateLabel = format(parseISO(dayKey), "yyyy.MM.dd (EEE)", { locale: ko });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        {dateLabel}
      </h2>

      <SplitScreenPlayer logs={logs} />

      <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {logs.map((log) => (
          <LogCard key={log.id} log={log} roomId={roomId} />
        ))}
      </div>
    </div>
  );
}
