import { useMemo, useState } from "react";
import type { LeagueStats } from "../../../store/api";
import PlayerAvatar from "./PlayerAvatar";

type Tab = "boot" | "glove" | "fair" | "lp" | "discipline";

const TABS: { id: Tab; label: string }[] = [
  { id: "boot", label: "Golden Boot" },
  { id: "glove", label: "Golden Glove" },
  { id: "fair", label: "Fair Play" },
  { id: "lp", label: "League Points" },
  { id: "discipline", label: "Discipline" },
];

const th =
  "pb-2 px-2 text-[10px] font-black uppercase tracking-wider text-zinc-400";
const td = "py-2 px-2";

/** Competition ranking: equal values share a rank (1, 2, 2, 4). */
const ranks = <T,>(rows: T[], value: (r: T) => number | string) =>
  rows.map((r, i) => (i > 0 && value(rows[i - 1]) === value(r) ? null : i + 1));

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-zinc-500 py-6 text-center">{children}</p>
);

/** Season stats from the match centre (Rules §10.3, §17.2, §19). */
const StatsPanel = ({ stats }: { stats: LeagueStats }) => {
  const [tab, setTab] = useState<Tab>("boot");
  const players = useMemo(
    () => new Map(stats.players.map((p) => [p._id, p])),
    [stats.players],
  );
  const teams = useMemo(
    () => new Map(stats.teams.map((t) => [t._id, t.name])),
    [stats.teams],
  );

  const renderPlayer = (id: string, team: string) => {
    const p = players.get(id);
    return (
      <span className="flex items-center gap-2 min-w-0">
        <PlayerAvatar name={p?.name ?? "?"} photo={p?.photo} size={28} />
        <span className="min-w-0">
          <span className="block font-semibold truncate">
            {p?.name ?? "Former player"}
          </span>
          <span className="block text-[11px] text-zinc-500 truncate">
            {teams.get(team)}
          </span>
        </span>
      </span>
    );
  };

  const boot = stats.goldenBoot.slice(0, 15);
  const bootRanks = ranks(boot, (r) => r.goals);
  const glove = stats.goldenGlove;
  const gloveRanks = ranks(glove, (r) => `${r.perMatch}-${r.cleanSheets}`);
  const lp = stats.lpValues;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Stats"
        className="flex gap-1.5 overflow-x-auto pb-2 mb-4"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${tab === t.id ? "bg-[#DD1D25] text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        {tab === "boot" &&
          (boot.length ? (
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-left">
                  <th className={`${th} w-8`}>#</th>
                  <th className={th}>Player</th>
                  <th className={`${th} text-right`}>Goals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {boot.map((r, i) => (
                  <tr key={r.player}>
                    <td className={`${td} font-black text-zinc-400`}>
                      {bootRanks[i] ?? ""}
                    </td>
                    <td className={td}>{renderPlayer(r.player, r.team)}</td>
                    <td className={`${td} text-right`}>
                      <span className="font-black text-base">{r.goals}</span>
                      {r.penalties > 0 && (
                        <span className="block text-[10px] text-zinc-400">
                          {r.penalties} pen
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>No goals yet.</Empty>
          ))}

        {tab === "glove" &&
          (glove.length ? (
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-left">
                  <th className={`${th} w-8`}>#</th>
                  <th className={th}>Goalkeeper</th>
                  <th className={`${th} text-right`}>P</th>
                  <th className={`${th} text-right`}>GA</th>
                  <th className={`${th} text-right`}>CS</th>
                  <th className={`${th} text-right`}>GA/match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {glove.map((r, i) => (
                  <tr key={r.player}>
                    <td className={`${td} font-black text-zinc-400`}>
                      {gloveRanks[i] ?? ""}
                    </td>
                    <td className={td}>{renderPlayer(r.player, r.team)}</td>
                    <td className={`${td} text-right`}>{r.matches}</td>
                    <td className={`${td} text-right`}>{r.conceded}</td>
                    <td className={`${td} text-right`}>{r.cleanSheets}</td>
                    <td className={`${td} text-right font-black`}>
                      {r.perMatch.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>
              No finished matches with a recorded goalkeeper yet. Set each
              team's goalkeeper in the match centre (a squad's only GK is used
              automatically).
            </Empty>
          ))}

        {tab === "fair" && (
          <>
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-left">
                  <th className={`${th} w-8`}>#</th>
                  <th className={th}>Team</th>
                  <th className={`${th} text-right`}>🟨</th>
                  <th className={`${th} text-right`}>🟥</th>
                  <th className={`${th} text-right`}>Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {stats.fairPlay.map((r, i) => (
                  <tr key={r.team}>
                    <td className={`${td} font-black text-zinc-400`}>
                      {i + 1}
                    </td>
                    <td className={`${td} font-semibold`}>
                      {teams.get(r.team)}
                    </td>
                    <td className={`${td} text-right`}>{r.yellows}</td>
                    <td className={`${td} text-right`}>{r.reds}</td>
                    <td className={`${td} text-right font-black`}>
                      {r.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-zinc-400 mt-3">
              1 point per yellow, 3 per red; a red after two yellows counts 3 in
              total. Fewest points wins the Fair Play Award and breaks ties in
              the tables.
            </p>
          </>
        )}

        {tab === "lp" && (
          <>
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-left">
                  <th className={`${th} w-8`}>#</th>
                  <th className={th}>Team</th>
                  <th className={`${th} text-right`}>P</th>
                  <th className={`${th} text-right hidden sm:table-cell`}>
                    Result
                  </th>
                  <th className={`${th} text-right hidden sm:table-cell`}>
                    Goals
                  </th>
                  <th className={`${th} text-right hidden md:table-cell`}>
                    CS
                  </th>
                  <th className={`${th} text-right hidden md:table-cell`}>
                    Pens
                  </th>
                  <th className={`${th} text-right hidden md:table-cell`}>
                    Clean
                  </th>
                  <th className={`${th} text-right`}>LP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {stats.leaguePoints.map((r, i) => (
                  <tr key={r.team}>
                    <td className={`${td} font-black text-zinc-400`}>
                      {i + 1}
                    </td>
                    <td className={`${td} font-semibold`}>
                      {teams.get(r.team)}
                    </td>
                    <td className={`${td} text-right`}>{r.matches}</td>
                    <td className={`${td} text-right hidden sm:table-cell`}>
                      {r.results}
                    </td>
                    <td className={`${td} text-right hidden sm:table-cell`}>
                      {r.goals}
                    </td>
                    <td className={`${td} text-right hidden md:table-cell`}>
                      {r.cleanSheets}
                    </td>
                    <td className={`${td} text-right hidden md:table-cell`}>
                      {r.penaltiesScored + r.penaltiesSaved}
                    </td>
                    <td className={`${td} text-right hidden md:table-cell`}>
                      {r.eligible + r.noCards}
                    </td>
                    <td className={`${td} text-right font-black`}>{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-zinc-400 mt-3 leading-relaxed">
              Earned per match (§17.2): eligible squad {lp.eligible} · win{" "}
              {lp.win} · draw {lp.draw} · goal {lp.goal} · clean sheet{" "}
              {lp.cleanSheet} · penalty scored {lp.penaltyScored} · penalty
              saved {lp.penaltySaved} · no cards {lp.noCards}. A forfeit earns
              the winner the win only. LP are separate from table points.
            </p>
          </>
        )}

        {tab === "discipline" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
                Currently suspended
              </h4>
              {stats.suspensions.length ? (
                <ul className="space-y-2">
                  {stats.suspensions.map((s) => (
                    <li
                      key={`${s.player}-${s.fromMatch}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      {renderPlayer(s.player, s.team)}
                      <span className="shrink-0 text-xs font-bold text-red-500">
                        {s.remaining} match{s.remaining > 1 ? "es" : ""} left
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">Nobody is suspended.</p>
              )}
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
                Cards
              </h4>
              {stats.cards.length ? (
                <table className="w-full text-sm tabular-nums">
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {stats.cards.map((c) => (
                      <tr key={c.player}>
                        <td className={td}>{renderPlayer(c.player, c.team)}</td>
                        <td className={`${td} text-right`}>🟨 {c.yellows}</td>
                        <td className={`${td} text-right`}>🟥 {c.reds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-zinc-500">No cards yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPanel;
