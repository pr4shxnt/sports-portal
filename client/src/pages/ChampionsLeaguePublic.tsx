import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  type PublicCompetition,
  useGetPublicCompetitionQuery,
  useGetPublicCompetitionsQuery,
} from "../store/api";
import CompetitionPhases from "../components/auth_client/champions/CompetitionPhases";
import PlayerAvatar from "../components/auth_client/champions/PlayerAvatar";
import logo from "../assets/logo_main.png";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <img src={logo} alt="SSRC" className="h-8 w-auto" />
          <span className="font-black tracking-tight truncate">
            SSRC Sports
          </span>
        </Link>
        <Link
          to="/champions-league"
          className="text-xs font-bold text-zinc-500 hover:text-[#DD1D25]"
        >
          Champions League
        </Link>
      </div>
    </nav>
    <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10">{children}</main>
  </div>
);

/** Squads with player photos; one team expanded at a time. */
const Squads = ({ teams }: { teams: PublicCompetition["teams"] }) => {
  const [open, setOpen] = useState<string | null>(null);
  if (!teams.length)
    return <p className="text-sm text-zinc-500">No teams confirmed yet.</p>;
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {teams.map((team) => {
        const expanded = open === team._id;
        return (
          <div
            key={team._id}
            className={`rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 ${expanded ? "sm:col-span-2" : ""}`}
          >
            <button
              onClick={() => setOpen(expanded ? null : team._id)}
              aria-expanded={expanded}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <span className="flex-1 min-w-0">
                <span className="block font-black truncate">{team.name}</span>
                <span className="block text-[11px] text-zinc-500">
                  {team.players.length} players
                </span>
              </span>
              {!expanded && (
                <span className="flex -space-x-1">
                  {team.players.slice(0, 5).map((p) => (
                    <PlayerAvatar
                      key={p._id}
                      name={p.name}
                      photo={p.photo}
                      size={28}
                      className="ring-2 ring-white dark:ring-zinc-900"
                    />
                  ))}
                </span>
              )}
              <span className="text-zinc-400 text-xs">
                {expanded ? "▴" : "▾"}
              </span>
            </button>
            {expanded && (
              <ul className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 px-4 pb-5">
                {team.players.map((p) => (
                  <li key={p._id} className="text-center">
                    <div className="relative inline-block">
                      <PlayerAvatar name={p.name} photo={p.photo} size={88} />
                      {p.shirtNumber != null && (
                        <span className="absolute -bottom-1 -right-1 min-w-7 h-7 px-1 rounded-full bg-[#DD1D25] text-white text-xs font-black flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 tabular-nums">
                          {p.shirtNumber}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-bold leading-tight">
                      {p.name}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-0.5">
                      {p.position === "GK" ? "Goalkeeper" : "Outfield"}
                      {p.captaincy === "captain" && " · Captain"}
                      {p.captaincy === "vice" && " · Vice-captain"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

/** Read-only list of seasons. */
const CompetitionList = () => {
  const { data = [], isLoading, isError } = useGetPublicCompetitionsQuery();
  return (
    <Shell>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-1">
        Sunway Champions League
      </h1>
      <p className="text-sm text-zinc-500 mb-8">
        Live tables, fixtures and knockout brackets.
      </p>
      {isLoading ? (
        <div className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
      ) : isError ? (
        <p className="text-red-500 text-sm">Couldn't load competitions.</p>
      ) : data.length === 0 ? (
        <p className="text-zinc-500 text-sm">
          No competitions yet — check back soon.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.map((c) => (
            <Link
              key={c._id}
              to={`/champions-league/${c.formSlug}`}
              className="group p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-[#DD1D25] transition-colors"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {c.sport}
                {c.season && ` · ${c.season}`}
              </p>
              <h2 className="text-lg font-black group-hover:text-[#DD1D25] transition-colors">
                {c.name}
              </h2>
              <p className="text-xs mt-2 font-bold text-zinc-500">
                {c.status === "live" ? "● Live" : "Registration & team list"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
};

/** Read-only standings, fixtures and bracket for one season. */
const CompetitionView = ({ slug }: { slug: string }) => {
  const { data, isLoading, isError } = useGetPublicCompetitionQuery(slug, {
    pollingInterval: 60_000, // Scores update during match days.
  });

  if (isLoading)
    return (
      <Shell>
        <div className="space-y-4">
          <div className="h-36 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-80 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
      </Shell>
    );
  if (isError || !data)
    return (
      <Shell>
        <p className="text-center py-16 text-zinc-500">
          Competition not found.{" "}
          <Link to="/champions-league" className="underline">
            See all competitions
          </Link>
        </p>
      </Shell>
    );

  const { competition, teams, draws, registrationOpen } = data;

  return (
    <Shell>
      <header className="p-6 sm:p-8 rounded-2xl bg-zinc-900 text-white relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-linear-to-br from-[#DD1D25]/35 via-transparent to-transparent" />
        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">
            {competition.sport}
            {competition.season && ` · ${competition.season}`} · {teams.length}{" "}
            teams
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight break-words">
            {competition.name}
          </h1>
          {competition.description && (
            <p className="text-sm text-white/80 mt-3 max-w-2xl whitespace-pre-wrap">
              {competition.description}
            </p>
          )}
          {registrationOpen && (
            <Link
              to={`/form/${competition.formSlug}`}
              className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-[#DD1D25] text-white text-sm font-bold hover:bg-[#C41920]"
            >
              Register your team →
            </Link>
          )}
        </div>
      </header>

      {draws.length > 0 ? (
        <CompetitionPhases draws={draws} canManage={false} />
      ) : (
        <p className="text-xs text-zinc-500 mb-6">
          The league starts once registration closes. Fixtures will appear here.
        </p>
      )}

      <section className={draws.length ? "mt-12" : ""}>
        <h2 className="text-lg font-black mb-4">Squads</h2>
        <Squads teams={teams} />
      </section>
    </Shell>
  );
};

const ChampionsLeaguePublic = () => {
  const { slug } = useParams();
  return slug ? <CompetitionView slug={slug} /> : <CompetitionList />;
};

export default ChampionsLeaguePublic;
