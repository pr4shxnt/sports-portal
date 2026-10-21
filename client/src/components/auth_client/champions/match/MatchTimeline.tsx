import type { MatchDetail } from "../../../../store/api";
import PlayerAvatar from "../PlayerAvatar";
import { EVENT_LABEL, HALF_MINUTES, eventTag } from "./eventMeta";
import EventIcon from "./EventIcon";

interface MatchTimelineProps {
  detail: MatchDetail;
  /** Admin only: delete an event. */
  onRemove?: (eventId: string) => void;
  disabled?: boolean;
}

/**
 * Goals and cards in minute order, home events on the left and away on the
 * right, with a half-time divider.
 */
const MatchTimeline = ({ detail, onRemove, disabled }: MatchTimelineProps) => {
  const { match } = detail;
  const players = new Map(detail.players.map((p) => [p._id, p]));
  const events = [...match.events].sort((a, b) => a.minute - b.minute);
  const firstSecondHalf = events.findIndex((e) => e.minute > HALF_MINUTES);

  if (!events.length)
    return (
      <p className="text-center text-xs text-zinc-400 py-6">
        No goals or cards yet.
      </p>
    );

  return (
    <ol className="space-y-1.5">
      {events.map((e, i) => {
        const isHome = e.team === match.home;
        const player = e.player ? players.get(e.player) : undefined;
        const tag = eventTag(e);
        const row = (
          <div
            className={`flex items-center gap-2 min-w-0 ${isHome ? "" : "flex-row-reverse text-right"}`}
          >
            <EventIcon event={e} />
            {player && (
              <PlayerAvatar name={player.name} photo={player.photo} size={24} />
            )}
            <span className="min-w-0 truncate text-sm">
              <span className="font-semibold">
                {player
                  ? player.name
                  : e.player
                    ? "Former player"
                    : EVENT_LABEL[e.type]}
              </span>
              {player?.shirtNumber != null && (
                <span className="text-zinc-400 text-xs">
                  {" "}
                  #{player.shirtNumber}
                </span>
              )}
              {tag && (
                <span className="ml-1 text-[10px] font-bold uppercase text-zinc-400">
                  {tag}
                </span>
              )}
            </span>
          </div>
        );
        return (
          <li key={e._id}>
            {i === firstSecondHalf && i > 0 && (
              <div className="my-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                <span className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                Half-time
                <span className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
              </div>
            )}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="min-w-0">{isHome && row}</div>
              <span className="w-10 text-center text-xs font-black tabular-nums text-zinc-500">
                {e.minute}'
              </span>
              <div className="min-w-0 flex items-center gap-1 justify-end">
                {!isHome && row}
                {onRemove && !e.causedBy && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRemove(e._id)}
                    aria-label={`Remove ${EVENT_LABEL[e.type]} at ${e.minute}'`}
                    className="ml-1 w-6 h-6 shrink-0 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-30 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default MatchTimeline;
