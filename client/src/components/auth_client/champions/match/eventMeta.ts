import type { MatchEvent, MatchEventType } from "../../../../store/api";

/** Regulation time: two halves of 25 minutes (§11.1). */
export const HALF_MINUTES = 25;
export const MATCH_MINUTES = 50;

export const EVENT_LABEL: Record<MatchEventType, string> = {
  goal: "Goal",
  penalty_goal: "Penalty goal",
  own_goal: "Own goal",
  penalty_missed: "Penalty missed",
  yellow: "Yellow card",
  red: "Red card",
};

/** Extra tag shown after the player's name. */
export const eventTag = (event: MatchEvent) => {
  if (event.type === "penalty_goal") return "pen";
  if (event.type === "own_goal") return "OG";
  if (event.type === "penalty_missed")
    return event.saved ? "pen saved" : "pen missed";
  if (event.secondYellow) return "2nd yellow";
  return null;
};

export const halfLabel = (minute: number) =>
  minute <= HALF_MINUTES ? "1st half" : "2nd half";

export const STATUS_LABEL = {
  scheduled: "Scheduled",
  live: "Live",
  finished: "Full time",
} as const;

export const statusClass = (status: keyof typeof STATUS_LABEL) =>
  status === "live"
    ? "bg-emerald-500 text-white animate-pulse"
    : status === "finished"
      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";

export const formatKickoff = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Time TBC";
