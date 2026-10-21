import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "../../../ui/Modal";
import {
  errorMessage,
  useChangeMatchMutation,
  useGetMatchDetailQuery,
  useOpenMatchMutation,
  type MatchDetail,
  type MatchEventType,
  type MatchUpdate,
  type NewMatchEvent,
  type OpenMatchBody,
  type ShootoutKick,
} from "../../../../store/api";
import MatchTimeline from "./MatchTimeline";
import EventIcon from "./EventIcon";
import {
  EVENT_LABEL,
  MATCH_MINUTES,
  STATUS_LABEL,
  halfLabel,
  statusClass,
} from "./eventMeta";

interface MatchCentreModalProps {
  competitionId: string;
  fixture: OpenMatchBody;
  onClose: () => void;
  /** Offered once the match is finished. */
  onWriteReport?: (detail: MatchDetail) => void;
}

const EVENT_TYPES: MatchEventType[] = [
  "goal",
  "penalty_goal",
  "own_goal",
  "penalty_missed",
  "yellow",
  "red",
];

const field =
  "w-full min-w-0 px-2.5 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-[#DD1D25]/40";
const chip = (active: boolean) =>
  `px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${active ? "border-[#DD1D25] bg-[#DD1D25]/10 text-[#DD1D25]" : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300"}`;

/** datetime-local value in the viewer's time zone. */
const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

/** Admin match centre: schedule, timeline, shootout and full time. */
const MatchCentreModal = ({
  competitionId,
  fixture,
  onClose,
  onWriteReport,
}: MatchCentreModalProps) => {
  const [open, { data: opened, error: openError }] = useOpenMatchMutation();
  const requested = useRef(false);
  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    open({ competitionId, body: fixture });
  }, [open, competitionId, fixture]);
  const matchDocId = opened?.match._id;
  const { data: fresh } = useGetMatchDetailQuery(
    { competitionId, matchDocId: matchDocId! },
    { skip: !matchDocId },
  );
  const detail = fresh ?? opened;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={detail?.stage ? `Match centre · ${detail.stage}` : "Match centre"}
      size="xl"
    >
      {detail ? (
        <MatchCentre
          competitionId={competitionId}
          detail={detail}
          onWriteReport={onWriteReport}
        />
      ) : openError ? (
        <p className="text-sm text-red-500">
          {errorMessage(openError, "Couldn't open this match")}
        </p>
      ) : (
        <div className="h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      )}
    </Modal>
  );
};

const MatchCentre = ({
  competitionId,
  detail,
  onWriteReport,
}: {
  competitionId: string;
  detail: MatchDetail;
  onWriteReport?: (detail: MatchDetail) => void;
}) => {
  const { match, home, away } = detail;
  const [change, { isLoading: saving }] = useChangeMatchMutation();
  const finished = match.status === "finished";
  const ids = { competitionId, matchDocId: match._id };

  const run = async (
    args: Omit<Parameters<typeof change>[0], "competitionId" | "matchDocId">,
    success?: string,
  ) => {
    try {
      await change({ ...ids, ...args }).unwrap();
      if (success) toast.success(success);
      return true;
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save"));
      return false;
    }
  };

  /* ── Schedule ── */
  const [kickoff, setKickoff] = useState(toLocalInput(match.kickoff));
  const [venue, setVenue] = useState(match.venue ?? "");
  const scheduleChanged =
    kickoff !== toLocalInput(match.kickoff) || venue !== (match.venue ?? "");
  const saveSchedule = () => {
    const update: MatchUpdate = {
      kickoff: kickoff ? new Date(kickoff).toISOString() : null,
      venue,
    };
    run({ update }, "Schedule saved");
  };

  /* ── New event ── */
  const [type, setType] = useState<MatchEventType>("goal");
  const [team, setTeam] = useState(match.home);
  const [player, setPlayer] = useState("");
  const [minute, setMinute] = useState("");
  const [saved, setSaved] = useState(false);
  const squad = detail.players.filter((p) => p.team === team);
  const suspended = new Set(detail.suspended);
  const minuteNum = Number(minute);
  const minuteOk =
    Number.isInteger(minuteNum) && minuteNum >= 1 && minuteNum <= MATCH_MINUTES;
  const needsPlayer = ["yellow", "red", "penalty_missed"].includes(type);

  const addEvent = async () => {
    const event: NewMatchEvent = {
      type,
      team,
      minute: minuteNum,
      ...(player && { player }),
      ...(type === "penalty_missed" && { saved }),
    };
    if (player && suspended.has(player)) {
      const name = squad.find((p) => p._id === player)?.name;
      if (
        !window.confirm(
          `${name} is suspended for this match (§13.2). Fielding them can mean a forfeit (§9.6). Record anyway?`,
        )
      )
        return;
    }
    if (await run({ addEvent: event })) {
      setPlayer("");
      setMinute("");
      setSaved(false);
    }
  };

  /* ── Status ── */
  const setStatus = async (status: MatchUpdate["status"]) => {
    const msg =
      status === "finished"
        ? `Confirm full time: ${home.name} ${detail.score} ${away.name}?\n\nThe result goes into the table/bracket.`
        : status === "live" && finished
          ? "Reopen this match? Its result is removed from the table/bracket until you finish it again."
          : null;
    if (msg && !window.confirm(msg)) return;
    await run(
      { update: { status } },
      status === "finished" ? "Full time recorded" : undefined,
    );
  };

  const forfeit = async (teamId: string | null) => {
    const name = teamId === home._id ? home.name : away.name;
    if (
      teamId &&
      !window.confirm(
        `Record a forfeit by ${name}? The opponent wins 3–0 (§9.6) and the match is finished.`,
      )
    )
      return;
    await run(
      { update: { forfeitedBy: teamId, ...(!teamId && { status: "live" }) } },
      teamId ? "Forfeit recorded" : "Forfeit removed",
    );
  };

  return (
    <div className="space-y-5">
      {/* Scoreboard */}
      <div className="rounded-2xl bg-zinc-900 text-white p-4 sm:p-5">
        <div className="flex justify-center mb-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusClass(match.status)}`}
          >
            {match.forfeitedBy ? "Forfeit" : STATUS_LABEL[match.status]}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <p className="text-right font-black text-base sm:text-lg truncate">
            {home.name}
          </p>
          <p className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight">
            {detail.score.split(" (")[0]}
          </p>
          <p className="font-black text-base sm:text-lg truncate">
            {away.name}
          </p>
        </div>
        {detail.score.includes("pens") && (
          <p className="text-center text-xs text-white/70 mt-1">
            {detail.score.match(/\((.*)\)/)?.[1]}
          </p>
        )}
      </div>

      {/* Schedule */}
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
          Kick-off
          <input
            type="datetime-local"
            value={kickoff}
            onChange={(e) => setKickoff(e.target.value)}
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
          Venue
          <input
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Main court"
            className={`${field} mt-1`}
          />
        </label>
        <button
          type="button"
          onClick={saveSchedule}
          disabled={!scheduleChanged || saving}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40"
        >
          Save schedule
        </button>
      </div>

      {/* Starting goalkeepers (match sheet, §8.3) — for the Golden Glove */}
      <div className="grid sm:grid-cols-2 gap-2">
        {(["home", "away"] as const).map((side) => {
          const team = side === "home" ? home : away;
          const squad = detail.players.filter((p) => p.team === team._id);
          const keepers = squad.filter((p) => p.position === "GK");
          const value =
            match.goalkeepers?.[side] ??
            (keepers.length === 1 ? keepers[0]._id : "");
          return (
            <label
              key={side}
              className="text-xs font-bold text-zinc-600 dark:text-zinc-300"
            >
              {team.name} goalkeeper
              <select
                value={value ?? ""}
                disabled={saving}
                onChange={(e) =>
                  run({
                    update: {
                      goalkeepers: { [side]: e.target.value || null },
                    },
                  })
                }
                className={`${field} mt-1`}
              >
                <option value="">Not recorded</option>
                {[...keepers, ...squad.filter((p) => p.position !== "GK")].map(
                  (p) => (
                    <option key={p._id} value={p._id}>
                      {p.shirtNumber != null ? `#${p.shirtNumber} ` : ""}
                      {p.name}
                      {p.position === "GK" ? " (GK)" : ""}
                    </option>
                  ),
                )}
              </select>
            </label>
          );
        })}
      </div>

      {/* Add event */}
      {!finished && !match.forfeitedBy && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-3">
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Event type"
          >
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={type === t}
                className={`${chip(type === t)} inline-flex items-center gap-1.5`}
              >
                <EventIcon event={{ type: t }} />
                {EVENT_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-[auto_1fr_6rem_auto] gap-2 items-center">
            <div
              className="col-span-2 sm:col-span-1 flex gap-1.5"
              role="group"
              aria-label="Team"
            >
              {[home, away].map((t) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => {
                    setTeam(t._id);
                    setPlayer("");
                  }}
                  aria-pressed={team === t._id}
                  className={`${chip(team === t._id)} max-w-[10rem] truncate`}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <select
              aria-label="Player"
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
              className={`${field} col-span-2 sm:col-span-1`}
            >
              <option value="">
                {needsPlayer ? "Choose player…" : "Player (optional)"}
              </option>
              {squad.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.shirtNumber != null ? `#${p.shirtNumber} ` : ""}
                  {p.name}
                  {p.position === "GK" ? " (GK)" : ""}
                  {suspended.has(p._id) ? " — SUSPENDED" : ""}
                </option>
              ))}
            </select>
            <input
              aria-label="Minute"
              type="number"
              min={1}
              max={MATCH_MINUTES}
              placeholder="Min"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className={`${field} text-center`}
            />
            <button
              type="button"
              onClick={addEvent}
              disabled={saving || !minuteOk || (needsPlayer && !player)}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#DD1D25] text-white hover:bg-[#C41920] disabled:opacity-40"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
            {minuteOk && <span>{halfLabel(minuteNum)}</span>}
            {minute && !minuteOk && (
              <span className="text-red-500">
                Minute must be 1–{MATCH_MINUTES}
              </span>
            )}
            {type === "own_goal" && (
              <span>
                Pick the player who scored it; the goal counts for the other
                team.
              </span>
            )}
            {type === "yellow" && (
              <span>
                A second yellow for the same player adds a red automatically.
              </span>
            )}
            {type === "penalty_missed" && (
              <label className="inline-flex items-center gap-1.5 font-semibold">
                <input
                  type="checkbox"
                  checked={saved}
                  onChange={(e) => setSaved(e.target.checked)}
                  className="accent-[#DD1D25]"
                />
                Saved by the goalkeeper
              </label>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
          Timeline
        </h3>
        <MatchTimeline
          detail={detail}
          disabled={saving}
          onRemove={
            finished ? undefined : (eventId) => run({ removeEventId: eventId })
          }
        />
      </div>

      {detail.needsShootout && (
        <Shootout
          key={match.shootout.length}
          detail={detail}
          disabled={finished || saving}
          onSave={(kicks) => run({ shootout: kicks }, "Shootout saved")}
        />
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-wrap gap-2">
          {match.forfeitedBy ? (
            <button
              type="button"
              onClick={() => forfeit(null)}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-200 dark:border-zinc-700"
            >
              Undo forfeit
            </button>
          ) : (
            !finished &&
            [home, away].map((t) => (
              <button
                key={t._id}
                type="button"
                onClick={() => forfeit(t._id)}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 max-w-[12rem] truncate"
              >
                {t.name} forfeits
              </button>
            ))
          )}
        </div>
        <div className="flex gap-2">
          {match.status === "scheduled" && (
            <button
              type="button"
              onClick={() => setStatus("live")}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Kick off
            </button>
          )}
          {match.status === "live" && (
            <button
              type="button"
              onClick={() => setStatus("finished")}
              disabled={saving || !detail.result}
              title={
                detail.result
                  ? undefined
                  : "A level knockout needs a decided shootout"
              }
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#DD1D25] text-white hover:bg-[#C41920] disabled:opacity-40"
            >
              Full time
            </button>
          )}
          {finished && onWriteReport && (
            <button
              type="button"
              onClick={() => onWriteReport(detail)}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Write match report
            </button>
          )}
          {finished && !match.forfeitedBy && (
            <button
              type="button"
              onClick={() => setStatus("live")}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/** Kings League style shootout (§12.2): one row per kick, in order. */
const Shootout = ({
  detail,
  disabled,
  onSave,
}: {
  detail: MatchDetail;
  disabled: boolean;
  onSave: (kicks: ShootoutKick[]) => void;
}) => {
  const { match, home, away } = detail;
  const [kicks, setKicks] = useState<ShootoutKick[]>(match.shootout);
  const tally = (teamId: string) =>
    kicks.filter((k) => k.team === teamId && k.scored).length;
  const nextTeam =
    kicks.length && kicks[kicks.length - 1].team === match.home
      ? match.away
      : match.home;
  const set = (i: number, patch: Partial<ShootoutKick>) =>
    setKicks(kicks.map((k, j) => (j === i ? { ...k, ...patch } : k)));

  return (
    <div className="rounded-xl border-2 border-amber-300 dark:border-amber-800 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider">
          Penalty shootout
        </h3>
        <span className="text-sm font-black tabular-nums">
          {home.name} {tally(match.home)} – {tally(match.away)} {away.name}
        </span>
      </div>
      <p className="text-[11px] text-zinc-500">
        Level after regulation time, so the tie goes straight to a shootout (no
        extra time). Shootout goals don't count towards goal difference or the
        Golden Boot.
      </p>
      <ol className="space-y-1.5">
        {kicks.map((k, i) => (
          <li
            key={i}
            className="grid grid-cols-[1.5rem_1fr_1fr_auto_auto] gap-2 items-center"
          >
            <span className="text-[11px] font-black text-zinc-400 tabular-nums">
              {i + 1}
            </span>
            <span className="text-xs font-bold truncate">
              {k.team === match.home ? home.name : away.name}
            </span>
            <select
              aria-label={`Kick ${i + 1} taker`}
              value={k.player ?? ""}
              disabled={disabled}
              onChange={(e) => set(i, { player: e.target.value || undefined })}
              className={field}
            >
              <option value="">Taker (optional)</option>
              {detail.players
                .filter((p) => p.team === k.team)
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <select
              aria-label={`Kick ${i + 1} outcome`}
              value={k.scored ? "scored" : k.saved ? "saved" : "missed"}
              disabled={disabled}
              onChange={(e) =>
                set(i, {
                  scored: e.target.value === "scored",
                  saved: e.target.value === "saved",
                })
              }
              className={field}
            >
              <option value="scored">Scored</option>
              <option value="saved">Saved</option>
              <option value="missed">Missed</option>
            </select>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setKicks(kicks.filter((_, j) => j !== i))}
              aria-label={`Remove kick ${i + 1}`}
              className="w-7 h-7 rounded text-zinc-400 hover:text-red-500"
            >
              ✕
            </button>
          </li>
        ))}
      </ol>
      {!disabled && (
        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={() =>
              setKicks([...kicks, { team: nextTeam, scored: true }])
            }
            className="text-xs font-bold text-[#DD1D25] hover:underline"
          >
            + Kick ({nextTeam === match.home ? home.name : away.name})
          </button>
          <button
            type="button"
            onClick={() => onSave(kicks)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Save shootout
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchCentreModal;
