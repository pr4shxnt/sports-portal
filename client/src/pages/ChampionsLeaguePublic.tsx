import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  type PublicCompetition,
  useGetPublicCompetitionQuery,
  useGetPublicMatchQuery,
  useGetPublicMatchesQuery,
  useGetPublicStatsQuery,
  useGetPublicCompetitionsQuery,
} from "../store/api";
import CompetitionPhases from "../components/auth_client/champions/CompetitionPhases";
import PlayerAvatar from "../components/auth_client/champions/PlayerAvatar";
import FixturesList from "../components/auth_client/champions/match/FixturesList";
import StatsPanel from "../components/auth_client/champions/StatsPanel";
import MatchTimeline from "../components/auth_client/champions/match/MatchTimeline";
import {
  STATUS_LABEL,
  formatKickoff,
  statusClass,
} from "../components/auth_client/champions/match/eventMeta";
import type { Fixture } from "../lib/tournament";
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
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetPublicCompetitionQuery(slug, {
    pollingInterval: 60_000, // Scores update during match days.
  });
  const { data: matches = [] } = useGetPublicMatchesQuery(slug, {
    pollingInterval: 60_000,
  });
  const { data: stats } = useGetPublicStatsQuery(slug, {
    pollingInterval: 120_000,
  });
  const openFixture = useCallback(
    (drawId: string, fixture: Fixture) => {
      const match = matches.find(
        (m) =>
          m.matchId === fixture.id &&
          (typeof m.draw === "object" ? m.draw._id : m.draw) === drawId,
      );
      if (match) navigate(`/champions-league/${slug}/match/${match._id}`);
      else toast("No match details yet.", { icon: "🕒" });
    },
    [matches, navigate, slug],
  );

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

      {matches.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-black mb-4">Fixtures & Results</h2>
          <FixturesList
            matches={matches}
            onSelect={(m) =>
              navigate(`/champions-league/${slug}/match/${m._id}`)
            }
          />
        </section>
      )}

      {draws.length > 0 ? (
        <CompetitionPhases
          draws={draws}
          canManage={false}
          onOpenMatch={openFixture}
        />
      ) : (
        <p className="text-xs text-zinc-500 mb-6">
          The league starts once registration closes. Fixtures will appear here.
        </p>
      )}

      {stats && stats.matchesPlayed + stats.goldenBoot.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-black mb-4">Stats</h2>
          <StatsPanel stats={stats} />
        </section>
      )}

      <section className={draws.length ? "mt-12" : ""}>
        <h2 className="text-lg font-black mb-4">Squads</h2>
        <Squads teams={teams} />
      </section>
    </Shell>
  );
};

/** One match: scoreboard, timeline, shootout and line-ups. */
const MatchView = ({
  slug,
  matchDocId,
}: {
  slug: string;
  matchDocId: string;
}) => {
  const { data, isLoading, isError } = useGetPublicMatchQuery(
    { slug, matchDocId },
    { pollingInterval: 30_000 },
  );
  const back = (
    <Link
      to={`/champions-league/${slug}`}
      className="text-sm text-zinc-500 hover:text-[#DD1D25]"
    >
      ← Back to the league
    </Link>
  );

  if (isLoading)
    return (
      <Shell>
        <div className="h-48 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
      </Shell>
    );
  if (isError || !data)
    return (
      <Shell>
        {back}
        <p className="text-center py-16 text-zinc-500">Match not found.</p>
      </Shell>
    );

  const { match, home, away } = data;
  const [regulation, pens] = data.score.split(" (");
  const players = new Map(data.players.map((p) => [p._id, p]));
  const lineup = (teamId: string) =>
    data.players.filter((p) => p.team === teamId);

  return (
    <Shell>
      {back}
      <header className="mt-4 p-6 sm:p-8 rounded-2xl bg-zinc-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-[#DD1D25]/35 via-transparent to-transparent" />
        <div className="relative">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-white/60">
            {[data.stage, formatKickoff(match.kickoff), match.venue]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <p className="text-right text-lg sm:text-2xl font-black break-words">
              {home.name}
            </p>
            <p className="text-4xl sm:text-6xl font-black tabular-nums tracking-tight">
              {match.status === "scheduled" ? "vs" : regulation}
            </p>
            <p className="text-lg sm:text-2xl font-black break-words">
              {away.name}
            </p>
          </div>
          {pens && (
            <p className="text-center text-sm text-white/80 mt-1">
              {pens.replace(")", "")} on penalties
            </p>
          )}
          <div className="flex justify-center mt-3">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusClass(match.status)}`}
            >
              {match.forfeitedBy
                ? `Forfeit by ${match.forfeitedBy === home._id ? home.name : away.name}`
                : STATUS_LABEL[match.status]}
            </span>
          </div>
        </div>
      </header>

      <section className="mt-8 p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">
          Timeline
        </h2>
        <MatchTimeline detail={data} />
      </section>

      {match.shootout.length > 0 && (
        <section className="mt-6 p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">
            Penalty shootout
          </h2>
          <ol className="grid sm:grid-cols-2 gap-1.5 text-sm">
            {match.shootout.map((k, i) => {
              const p = k.player ? players.get(k.player) : undefined;
              return (
                <li key={k._id ?? i} className="flex items-center gap-2">
                  <span className="w-5 text-xs text-zinc-400 tabular-nums">
                    {i + 1}
                  </span>
                  <span aria-hidden="true">
                    {k.scored ? "✅" : k.saved ? "🧤" : "❌"}
                  </span>
                  <span className="font-semibold truncate">
                    {p?.name ?? (k.team === home._id ? home.name : away.name)}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {k.scored ? "scored" : k.saved ? "saved" : "missed"}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="mt-6 grid sm:grid-cols-2 gap-4">
        {[home, away].map((t) => (
          <div
            key={t._id}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
          >
            <h2 className="font-black mb-3">{t.name}</h2>
            <ul className="space-y-2">
              {lineup(t._id).map((p) => (
                <li key={p._id} className="flex items-center gap-2 text-sm">
                  <PlayerAvatar name={p.name} photo={p.photo} size={32} />
                  <span className="w-6 text-right text-xs font-black text-zinc-400 tabular-nums">
                    {p.shirtNumber ?? ""}
                  </span>
                  <span className="font-semibold truncate">{p.name}</span>
                  {p.position === "GK" && (
                    <span className="text-[9px] font-black text-sky-600 dark:text-sky-400">
                      GK
                    </span>
                  )}
                  {p.captaincy === "captain" && (
                    <span className="text-[9px] font-black text-amber-600">
                      C
                    </span>
                  )}
                  {data.suspended.includes(p._id) && (
                    <span className="ml-auto text-[9px] font-black uppercase text-red-500">
                      Suspended
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </Shell>
  );
};

const ChampionsLeaguePublic = () => {
  const { slug, matchDocId } = useParams();
  if (slug && matchDocId)
    return <MatchView slug={slug} matchDocId={matchDocId} />;
  return slug ? <CompetitionView slug={slug} /> : <CompetitionList />;
};

export default ChampionsLeaguePublic;
