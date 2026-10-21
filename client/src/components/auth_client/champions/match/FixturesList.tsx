import type { MatchSummary } from "../../../../store/api";
import { STATUS_LABEL, statusClass } from "./eventMeta";

interface FixturesListProps {
  matches: MatchSummary[];
  onSelect: (match: MatchSummary) => void;
  empty?: string;
}

const dayKey = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "Date to be confirmed";

const timeOf = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "TBC";

const stageOf = (m: MatchSummary) =>
  typeof m.draw === "object" ? m.draw.stage : undefined;

/** Scheduled matches grouped by day, live first within the list order. */
const FixturesList = ({ matches, onSelect, empty }: FixturesListProps) => {
  if (!matches.length)
    return (
      <p className="text-sm text-zinc-500">
        {empty ?? "No matches scheduled yet."}
      </p>
    );

  const days = new Map<string, MatchSummary[]>();
  matches.forEach((m) => {
    const key = dayKey(m.kickoff);
    days.set(key, [...(days.get(key) ?? []), m]);
  });

  return (
    <div className="space-y-5">
      {[...days].map(([day, list]) => (
        <div key={day}>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
            {day}
          </h3>
          <ul className="space-y-1.5">
            {list.map((m) => {
              const score = m.score?.split(" (")[0];
              const pens = m.score?.match(/\((.*) pens\)/)?.[1];
              return (
                <li key={m._id}>
                  <button
                    type="button"
                    onClick={() => onSelect(m)}
                    className="w-full grid grid-cols-[3.5rem_1fr_auto_1fr] sm:grid-cols-[3.5rem_1fr_auto_1fr_6rem] items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-[#DD1D25]/50 text-left text-sm transition-colors"
                  >
                    <span className="text-xs font-bold tabular-nums text-zinc-500">
                      {timeOf(m.kickoff)}
                    </span>
                    <span className="truncate text-right font-bold">
                      {m.home.name}
                    </span>
                    <span className="min-w-14 text-center">
                      {m.status === "scheduled" ? (
                        <span className="text-xs font-bold text-zinc-400">
                          vs
                        </span>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-black tabular-nums ${m.status === "live" ? "bg-emerald-500 text-white" : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"}`}
                        >
                          {score}
                        </span>
                      )}
                      {pens && (
                        <span className="block text-[9px] text-zinc-400 mt-0.5">
                          {pens} pens
                        </span>
                      )}
                    </span>
                    <span className="truncate font-bold">{m.away.name}</span>
                    <span className="hidden sm:flex flex-col items-end gap-0.5 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusClass(m.status)}`}
                      >
                        {m.forfeitedBy ? "Forfeit" : STATUS_LABEL[m.status]}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate max-w-full">
                        {[stageOf(m), m.venue].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default FixturesList;
