import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  SQUAD_MAX,
  SQUAD_MIN,
  errorMessage,
  useCompetitionActionMutation,
  useDeleteCompetitionMutation,
  useGetCompetitionMatchesQuery,
  useGetCompetitionQuery,
  useRemoveLeagueTeamMutation,
  type LeagueTeam,
  type OpenMatchBody,
} from "../../../store/api";
import { type Draw, type Fixture } from "../../../lib/tournament";
import MatchCentreModal from "./match/MatchCentreModal";
import FixturesList from "./match/FixturesList";
import AdvancePhaseModal from "../tournament/AdvancePhaseModal";
import CompetitionPhases from "./CompetitionPhases";
import CompetitionFormModal from "./CompetitionFormModal";
import TeamEditorModal from "./TeamEditorModal";
import PlayerAvatar from "./PlayerAvatar";

const MIN_TEAMS = 4;

/** One Champions League season: form link, team management and phases. */
const ChampionsLeagueManage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGetCompetitionQuery(id!, {
    skip: !id,
  });
  const [runAction, { isLoading: acting, originalArgs }] =
    useCompetitionActionMutation();
  const [removeTeam] = useRemoveLeagueTeamMutation();
  const [deleteCompetition] = useDeleteCompetitionMutation();

  const [editingDetails, setEditingDetails] = useState(false);
  const [editingTeam, setEditingTeam] = useState<LeagueTeam | "new" | null>(
    null,
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<OpenMatchBody | null>(
    null,
  );
  const { data: matches = [] } = useGetCompetitionMatchesQuery(id!, {
    skip: !id,
  });
  const [advancingDraw, setAdvancingDraw] = useState<Draw | null>(null);

  const openMatch = useCallback(
    (drawId: string, fixture: Fixture) =>
      setSelectedMatch({
        drawId,
        matchId: fixture.id,
        home: fixture.home._id,
        away: fixture.away._id,
      }),
    [],
  );

  if (isLoading)
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        <div className="h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
      </div>
    );
  if (isError || !data)
    return (
      <div className="p-6 text-center text-red-500">
        Competition not found.{" "}
        <Link to="/dashboard/champions-league" className="underline">
          Back
        </Link>
      </div>
    );

  const { competition, teams, draws, form } = data;
  const isSetup = competition.status === "setup";
  const busy = (action: string) => acting && originalArgs?.action === action;
  const offSize = teams.filter(
    (t) => t.players.length < SQUAD_MIN || t.players.length > SQUAD_MAX,
  );

  const act = async (action: "sync" | "start" | "reset") => {
    const confirmText = {
      sync: null,
      start:
        `Start the league with ${teams.length} teams?\n\nThe team list will be locked and ${(teams.length * (teams.length - 1)) / 2} fixtures created (Win 3 · Draw 1 · Loss 0).` +
        (offSize.length
          ? `\n\n⚠ ${offSize.length} team(s) are outside the ${SQUAD_MIN}–${SQUAD_MAX} player squad size: ${offSize.map((t) => t.name).join(", ")}.`
          : ""),
      reset:
        "Reset the competition?\n\nEvery phase, score and result will be deleted and the team list unlocked. This cannot be undone.",
    }[action];
    if (confirmText && !window.confirm(confirmText)) return;
    try {
      const detail = await runAction({ id: competition._id, action }).unwrap();
      if (action === "sync") {
        const { added = 0, removed = 0 } = detail.sync ?? {};
        toast.success(
          added || removed
            ? `${added} added, ${removed} removed`
            : "Already up to date",
        );
      } else {
        toast.success(
          action === "start" ? "League started!" : "Competition reset",
        );
      }
    } catch (err) {
      toast.error(errorMessage(err, `Failed to ${action}`));
    }
  };

  const remove = async (team: LeagueTeam) => {
    const note = team.formSubmission
      ? "\n\nIt came from an approved application, so the next sync will bring it back unless the application is rejected."
      : "";
    if (!window.confirm(`Remove ${team.name}?${note}`)) return;
    try {
      await removeTeam({ id: competition._id, teamId: team._id }).unwrap();
      toast.success("Team removed");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to remove the team"));
    }
  };

  const destroy = async () => {
    if (
      window.prompt(
        `This deletes the competition, its ${teams.length} teams and every result.\n\nType the competition name to confirm:`,
      ) !== competition.name
    )
      return;
    try {
      await deleteCompetition(competition._id).unwrap();
      toast.success("Competition deleted");
      navigate("/dashboard/champions-league");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete"));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        to="/dashboard/champions-league"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
      >
        ← All competitions
      </Link>

      {/* Header */}
      <header className="p-5 sm:p-6 rounded-2xl bg-zinc-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-[#DD1D25]/30 via-transparent to-transparent" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">
              {competition.sport}
              {competition.season && ` · ${competition.season}`}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight break-words">
              {competition.name}
            </h1>
            <p className="text-xs text-white/70 mt-2">
              Form{" "}
              <code className="px-1.5 py-0.5 rounded bg-white/10">
                {competition.formSlug}
              </code>
              {form ? ` · ${form.formTitle}` : " · form not found"}
              {form && !form.isActive && " · closed"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/champions-league/${competition.formSlug}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors"
            >
              Public page ↗
            </a>
            <button
              onClick={() => setEditingDetails(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors"
            >
              Edit details
            </button>
          </div>
        </div>
      </header>

      {/* Teams */}
      <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="font-black">Teams ({teams.length})</h2>
            <p className="text-xs text-zinc-500">
              {isSetup
                ? "One team per approved application. Approving or rejecting an application updates this list automatically."
                : "Locked while the league runs. You can still fix names and players."}
            </p>
          </div>
          {isSetup && (
            <div className="flex gap-2">
              <button
                onClick={() => act("sync")}
                disabled={acting}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                {busy("sync") ? "Syncing…" : "↻ Sync applications"}
              </button>
              <button
                onClick={() => setEditingTeam("new")}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                + Add team
              </button>
            </div>
          )}
        </div>

        {teams.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">
            No approved applications yet. Approve them under Manage Forms →{" "}
            {form?.formTitle ?? competition.formSlug}, then sync.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {teams.map((team, i) => {
              const open = expanded === team._id;
              return (
                <li key={team._id}>
                  <div className="flex items-center gap-3 px-5 py-3">
                    <span className="w-6 text-[11px] font-black text-zinc-400 tabular-nums">
                      {i + 1}
                    </span>
                    <button
                      onClick={() => setExpanded(open ? null : team._id)}
                      aria-expanded={open}
                      className="flex-1 min-w-0 text-left"
                    >
                      <span className="block font-bold truncate">
                        {team.name}
                      </span>
                      <span className="block text-[11px] text-zinc-500">
                        <span
                          className={
                            team.players.length < SQUAD_MIN ||
                            team.players.length > SQUAD_MAX
                              ? "text-amber-600 dark:text-amber-400 font-semibold"
                              : ""
                          }
                        >
                          {team.players.length} player
                          {team.players.length === 1 ? "" : "s"}
                        </span>{" "}
                        ·{" "}
                        {team.formSubmission
                          ? "from application"
                          : "added by hand"}
                      </span>
                    </button>
                    <span className="hidden sm:flex -space-x-1">
                      {team.players.slice(0, 5).map((p) => (
                        <PlayerAvatar
                          key={p._id}
                          name={p.name}
                          photo={p.photo}
                          size={26}
                          className="ring-2 ring-white dark:ring-zinc-900"
                        />
                      ))}
                    </span>
                    <button
                      onClick={() => setEditingTeam(team)}
                      className="px-2.5 py-1 rounded-md text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                    {isSetup && (
                      <button
                        onClick={() => remove(team)}
                        className="px-2.5 py-1 rounded-md text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {open && (
                    <ol className="px-5 pb-4 pl-14 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      {team.players.length === 0 && (
                        <li className="text-zinc-400">No players listed.</li>
                      )}
                      {team.players.map((p) => (
                        <li
                          key={p._id}
                          className="flex items-center gap-2 min-w-0"
                        >
                          <PlayerAvatar
                            name={p.name}
                            photo={p.photo}
                            size={28}
                          />
                          <span className="w-6 text-right font-black text-zinc-400 tabular-nums">
                            {p.shirtNumber ?? ""}
                          </span>
                          <span className="font-semibold truncate">
                            {p.name}
                          </span>
                          {p.position === "GK" && (
                            <span className="px-1 rounded bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-[9px] font-black">
                              GK
                            </span>
                          )}
                          {p.captaincy && (
                            <span className="px-1 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[9px] font-black">
                              {p.captaincy === "captain" ? "C" : "VC"}
                            </span>
                          )}
                          <span className="text-zinc-500 truncate">
                            {[p.studentId, p.email].filter(Boolean).join(" · ")}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {isSetup && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 rounded-b-2xl">
            <p className="text-xs text-zinc-500">
              {teams.length < MIN_TEAMS
                ? `At least ${MIN_TEAMS} teams are needed to start.`
                : `${(teams.length * (teams.length - 1)) / 2} league fixtures · Win 3 · Draw 1 · Loss 0`}
              {offSize.length > 0 && (
                <span className="block text-amber-600 dark:text-amber-400 mt-0.5">
                  {offSize.length} squad{offSize.length > 1 ? "s" : ""} outside{" "}
                  {SQUAD_MIN}–{SQUAD_MAX} players
                </span>
              )}
            </p>
            <button
              onClick={() => act("start")}
              disabled={acting || teams.length < MIN_TEAMS}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#DD1D25] text-white hover:bg-[#C41920] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy("start") ? "Starting…" : "Start League →"}
            </button>
          </div>
        )}
      </section>

      {/* Phases */}
      {draws.length > 0 && (
        <section className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg sm:text-xl font-bold mb-6">
            🏆 League, Qualifiers & Knockout
          </h2>
          <CompetitionPhases
            draws={draws}
            canManage
            onOpenMatch={openMatch}
            onAdvance={setAdvancingDraw}
          />
        </section>
      )}

      {/* Schedule */}
      {draws.length > 0 && (
        <section className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold mb-1">Fixtures & Results</h2>
          <p className="text-xs text-zinc-500 mb-4">
            Open any fixture in the tables or bracket above to schedule it and
            record goals and cards. Scheduled matches appear here.
          </p>
          <FixturesList
            matches={matches}
            onSelect={(m) =>
              setSelectedMatch({
                drawId: typeof m.draw === "object" ? m.draw._id : m.draw,
                matchId: m.matchId,
                home: m.home._id,
                away: m.away._id,
              })
            }
          />
        </section>
      )}

      {/* Danger zone */}
      <section className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-red-200 dark:border-red-900/50">
        <p className="text-xs text-zinc-500">
          Reset deletes every phase and result and unlocks the teams. Delete
          removes the competition entirely.
        </p>
        <div className="flex gap-2">
          {!isSetup && (
            <button
              onClick={() => act("reset")}
              disabled={acting}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
            >
              Reset
            </button>
          )}
          <button
            onClick={destroy}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </section>

      {editingDetails && (
        <CompetitionFormModal
          isOpen
          competition={competition}
          onClose={() => setEditingDetails(false)}
        />
      )}
      {editingTeam && (
        <TeamEditorModal
          competitionId={competition._id}
          team={editingTeam === "new" ? undefined : editingTeam}
          onClose={() => setEditingTeam(null)}
        />
      )}
      {selectedMatch && (
        <MatchCentreModal
          key={`${selectedMatch.drawId}-${selectedMatch.matchId}`}
          competitionId={competition._id}
          fixture={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
      {advancingDraw && (
        <AdvancePhaseModal
          isOpen
          draw={advancingDraw}
          onClose={() => setAdvancingDraw(null)}
          onAdvanced={async (next) => {
            await refetch();
            requestAnimationFrame(() =>
              document
                .getElementById(`draw-${next._id}`)
                ?.scrollIntoView({ behavior: "smooth" }),
            );
          }}
        />
      )}
    </div>
  );
};

export default ChampionsLeagueManage;
