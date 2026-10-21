import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  type PublicCompetition,
  useGetPublicCompetitionQuery,
  useGetPublicMatchQuery,
  useGetPublicMatchesQuery,
  useGetPublicStatsQuery,
  useGetPublicNewsQuery,
  useGetPublicNewsPostQuery,
  type NewsPost,
  useGetPublicCompetitionsQuery,
} from "../store/api";
import CompetitionPhases from "../components/auth_client/champions/CompetitionPhases";
import PlayerAvatar from "../components/auth_client/champions/PlayerAvatar";
import FixturesList from "../components/auth_client/champions/match/FixturesList";
import StatsPanel from "../components/auth_client/champions/StatsPanel";
import NewsCard from "../components/auth_client/champions/news/NewsCard";
import {
  CATEGORY_LABEL,
  formatDate,
  paragraphs,
} from "../components/auth_client/champions/news/newsMeta";
import { imageUrl } from "../lib/cloudinary";
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
  const { data: latest } = useGetPublicNewsQuery({ slug, limit: 3 });
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

      {!!latest?.posts.length && (
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-black">Latest news</h2>
            <Link
              to={`/champions-league/${slug}/news`}
              className="text-xs font-bold text-[#DD1D25] hover:underline"
            >
              All news →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latest.posts.map((post) => (
              <NewsCard key={post._id} post={post} slug={slug} />
            ))}
          </div>
        </section>
      )}

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

/** All published news, newest first, loaded a page at a time. */
const NewsList = ({ slug }: { slug: string }) => {
  const [pages, setPages] = useState<string[]>([""]);
  return (
    <Shell>
      <Link
        to={`/champions-league/${slug}`}
        className="text-sm text-zinc-500 hover:text-[#DD1D25]"
      >
        ← Back to the league
      </Link>
      <h1 className="mt-4 mb-6 text-3xl sm:text-4xl font-black tracking-tight">
        News
      </h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((before, i) => (
          <NewsPage
            key={before || "first"}
            slug={slug}
            before={before}
            first={i === 0}
            onMore={
              i === pages.length - 1
                ? (next) => setPages((p) => [...p, next])
                : undefined
            }
          />
        ))}
      </div>
    </Shell>
  );
};

const NewsPage = ({
  slug,
  before,
  first,
  onMore,
}: {
  slug: string;
  before: string;
  first: boolean;
  onMore?: (before: string) => void;
}) => {
  const { data, isLoading } = useGetPublicNewsQuery({
    slug,
    limit: 12,
    before: before || undefined,
  });
  if (isLoading)
    return (
      <div className="aspect-video rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
    );
  const posts = data?.posts ?? [];
  if (first && !posts.length)
    return <p className="text-sm text-zinc-500 col-span-full">No news yet.</p>;
  const last: NewsPost | undefined = posts[posts.length - 1];
  return (
    <>
      {posts.map((post, i) => (
        <NewsCard
          key={post._id}
          post={post}
          slug={slug}
          featured={first && i === 0}
        />
      ))}
      {onMore && data?.hasMore && last?.publishedAt && (
        <div className="col-span-full flex justify-center pt-2">
          <button
            onClick={() => onMore(last.publishedAt!)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
};

/** One article; a linked match shows its scoreboard and timeline. */
const Article = ({ slug, postSlug }: { slug: string; postSlug: string }) => {
  const {
    data: post,
    isLoading,
    isError,
  } = useGetPublicNewsPostQuery({
    slug,
    postSlug,
  });
  const { data: match } = useGetPublicMatchQuery(
    { slug, matchDocId: post?.match ?? "" },
    { skip: !post?.match },
  );
  const back = (
    <Link
      to={`/champions-league/${slug}/news`}
      className="text-sm text-zinc-500 hover:text-[#DD1D25]"
    >
      ← All news
    </Link>
  );

  if (isLoading)
    return (
      <Shell>
        <div className="aspect-video rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
      </Shell>
    );
  if (isError || !post)
    return (
      <Shell>
        {back}
        <p className="text-center py-16 text-zinc-500">Article not found.</p>
      </Shell>
    );

  return (
    <Shell>
      {back}
      <article className="mt-4 max-w-3xl mx-auto">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#DD1D25]">
          {CATEGORY_LABEL[post.category]}
          <span className="text-zinc-400">
            {" "}
            · {formatDate(post.publishedAt)}
          </span>
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight leading-tight break-words">
          {post.title}
        </h1>
        {post.summary && (
          <p className="mt-3 text-lg text-zinc-500">{post.summary}</p>
        )}
        {post.cover && (
          <img
            src={imageUrl(post.cover.url, 1600, 900)}
            alt=""
            className="mt-6 w-full aspect-video object-cover rounded-2xl"
          />
        )}

        {match && (
          <Link
            to={`/champions-league/${slug}/match/${match.match._id}`}
            className="mt-6 block p-4 rounded-2xl bg-zinc-900 text-white hover:ring-2 hover:ring-[#DD1D25]/60 transition-shadow"
          >
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
              {[match.stage, STATUS_LABEL[match.match.status]]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <span className="text-right font-black truncate">
                {match.home.name}
              </span>
              <span className="text-2xl font-black tabular-nums">
                {match.score.split(" (")[0]}
              </span>
              <span className="font-black truncate">{match.away.name}</span>
            </div>
            <p className="text-center text-[11px] text-white/60 mt-1">
              Match centre →
            </p>
          </Link>
        )}

        <div className="mt-8 space-y-5 text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
          {paragraphs(post.body).map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>

        {match && match.match.events.length > 0 && (
          <section className="mt-10 p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">
              Match timeline
            </h2>
            <MatchTimeline detail={match} />
          </section>
        )}
      </article>
    </Shell>
  );
};

const ChampionsLeaguePublic = ({ view }: { view?: "news" }) => {
  const { slug, matchDocId, postSlug } = useParams();
  if (slug && postSlug) return <Article slug={slug} postSlug={postSlug} />;
  if (slug && view === "news") return <NewsList slug={slug} />;
  if (slug && matchDocId)
    return <MatchView slug={slug} matchDocId={matchDocId} />;
  return slug ? <CompetitionView slug={slug} /> : <CompetitionList />;
};

export default ChampionsLeaguePublic;
