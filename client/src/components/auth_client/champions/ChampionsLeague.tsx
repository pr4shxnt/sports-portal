import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetCompetitionsQuery } from "../../../store/api";
import CompetitionFormModal from "./CompetitionFormModal";

/** Admin list of Champions League seasons. */
const ChampionsLeague = () => {
  const navigate = useNavigate();
  const {
    data: competitions = [],
    isLoading,
    isError,
  } = useGetCompetitionsQuery();
  const [creating, setCreating] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#DD1D25]">
            Sunway
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Champions League
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Teams come straight from approved applications. League → qualifiers
            → knockout.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/champions-league"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg text-sm font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Public page ↗
          </a>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-[#DD1D25] text-white hover:bg-[#C41920] transition-colors"
          >
            + New Competition
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="text-red-500 text-sm">Failed to load competitions.</p>
      ) : competitions.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-bold">No competitions yet</p>
          <p className="text-sm text-zinc-500 mt-1 mb-5">
            Create one and link the registration form by its slug.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[#DD1D25] text-white hover:bg-[#C41920]"
          >
            Create the first season
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {competitions.map((c) => (
            <Link
              key={c._id}
              to={`/dashboard/champions-league/${c._id}`}
              className="group p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-[#DD1D25] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {c.sport}
                    {c.season && ` · ${c.season}`}
                  </p>
                  <h2 className="text-lg font-black truncate group-hover:text-[#DD1D25] transition-colors">
                    {c.name}
                  </h2>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${c.status === "live" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"}`}
                >
                  {c.status === "live" ? "Live" : "Setup"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-3">
                {c.teamCount ?? 0} teams · form{" "}
                <code className="text-zinc-700 dark:text-zinc-300">
                  {c.formSlug}
                </code>
              </p>
            </Link>
          ))}
        </div>
      )}

      {creating && (
        <CompetitionFormModal
          isOpen
          onClose={() => setCreating(false)}
          onSaved={(detail) =>
            navigate(`/dashboard/champions-league/${detail.competition._id}`)
          }
        />
      )}
    </div>
  );
};

export default ChampionsLeague;
