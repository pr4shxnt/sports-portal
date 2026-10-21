/**
 * Pure match rules from the League's Rules and Regulations. Kept free of
 * database access so they are easy to test and reuse for stats later.
 */
import { HALF_MINUTES } from "../models/Match.js";

type Id = { toString(): string };
const same = (a?: Id | null, b?: Id | null) =>
  !!a && !!b && a.toString() === b.toString();

export interface EventLike {
  _id?: Id;
  type: string;
  team: Id;
  player?: Id | null;
  minute: number;
  saved?: boolean;
  secondYellow?: boolean;
}

export interface KickLike {
  team: Id;
  scored: boolean;
}

export interface MatchLike {
  home: Id;
  away: Id;
  knockout: boolean;
  events: EventLike[];
  shootout: KickLike[];
  forfeitedBy?: Id | null;
}

export const halfOf = (minute: number) => (minute <= HALF_MINUTES ? 1 : 2);

const GOALS = new Set(["goal", "penalty_goal", "own_goal"]);

/** Team credited with a goal event (own goals count for the opponent). */
export const goalFor = (match: MatchLike, e: EventLike) =>
  e.type === "own_goal"
    ? same(e.team, match.home)
      ? match.away
      : match.home
    : e.team;

/** Regulation-time score. A forfeit is recorded as 3–0 (§9.6). */
export const scoreOf = (match: MatchLike) => {
  if (match.forfeitedBy) {
    return same(match.forfeitedBy, match.home)
      ? { home: 0, away: 3 }
      : { home: 3, away: 0 };
  }
  let home = 0;
  let away = 0;
  for (const e of match.events) {
    if (!GOALS.has(e.type)) continue;
    if (same(goalFor(match, e), match.home)) home++;
    else away++;
  }
  return { home, away };
};

export const shootoutScore = (match: MatchLike) => ({
  home: match.shootout.filter((k) => k.scored && same(k.team, match.home))
    .length,
  away: match.shootout.filter((k) => k.scored && same(k.team, match.away))
    .length,
});

/** Needs a shootout: a knockout level after regulation time (§9.1). */
export const needsShootout = (match: MatchLike) => {
  if (!match.knockout || match.forfeitedBy) return false;
  const s = scoreOf(match);
  return s.home === s.away;
};

/**
 * "2 - 1", or "2 - 2 (4 - 3 pens)" for a knockout decided on penalties
 * (§10.2: the shootout is shown beside the regulation score).
 */
export const scoreString = (match: MatchLike) => {
  const s = scoreOf(match);
  const base = `${s.home} - ${s.away}`;
  if (!needsShootout(match) || !match.shootout.length) return base;
  const p = shootoutScore(match);
  return `${base} (${p.home} - ${p.away} pens)`;
};

/**
 * Winner's team id, "DRAW" for a level league/group match, or null when a
 * knockout is still level (shootout missing or undecided).
 */
export const resultOf = (match: MatchLike): string | null => {
  if (match.forfeitedBy) {
    return (
      same(match.forfeitedBy, match.home) ? match.away : match.home
    ).toString();
  }
  const s = scoreOf(match);
  if (s.home !== s.away)
    return (s.home > s.away ? match.home : match.away).toString();
  if (!match.knockout) return "DRAW";
  const p = shootoutScore(match);
  if (p.home === p.away) return null;
  return (p.home > p.away ? match.home : match.away).toString();
};

const byMinute = (a: EventLike, b: EventLike) => a.minute - b.minute;

/**
 * True when a new yellow at `minute` is the player's second since their
 * last red in this match, i.e. it becomes a red card (§13.1).
 */
export const isSecondYellow = (
  events: EventLike[],
  player: Id,
  minute: number,
) => {
  const mine = events
    .filter((e) => same(e.player, player) && e.minute <= minute)
    .sort(byMinute);
  let yellows = 0;
  for (const e of mine) {
    if (e.type === "red")
      yellows = 0; // count restarts after a red
    else if (e.type === "yellow") yellows++;
  }
  return yellows >= 1;
};

/** Red cards (straight or from two yellows) per player in one match. */
export const redsByPlayer = (match: MatchLike) => {
  const reds = new Map<string, number>();
  for (const e of match.events) {
    if (e.type !== "red" || !e.player) continue;
    const key = e.player.toString();
    reds.set(key, (reds.get(key) ?? 0) + 1);
  }
  return reds;
};

/** Match ban for a player's red cards in one match (§13.2). */
export const banLength = (reds: number) => (reds >= 2 ? 2 : reds === 1 ? 1 : 0);

export interface ScheduledMatch extends MatchLike {
  _id: Id;
  status: string;
  kickoff?: Date | null;
  createdAt?: Date;
}

export interface Suspension {
  player: string;
  team: string;
  fromMatch: string;
  matches: number;
  /** The team's later matches the ban applies to, in order. */
  servedIn: string[];
  remaining: number;
}

const chronological = (a: ScheduledMatch, b: ScheduledMatch) =>
  (a.kickoff?.getTime() ?? Infinity) - (b.kickoff?.getTime() ?? Infinity) ||
  (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);

/**
 * Bans from finished matches, served in the team's next matches by
 * kick-off time (§13.2). Matches without a kick-off time come last.
 */
export const suspensions = (matches: ScheduledMatch[]): Suspension[] => {
  const ordered = [...matches].sort(chronological);
  const out: Suspension[] = [];
  ordered.forEach((match, i) => {
    if (match.status !== "finished") return;
    redsByPlayer(match).forEach((reds, player) => {
      const team = match.events.find((e) => same(e.player, player))!.team;
      const later = ordered
        .slice(i + 1)
        .filter((m) => same(m.home, team) || same(m.away, team));
      const n = banLength(reds);
      const servedIn = later.slice(0, n);
      out.push({
        player,
        team: team.toString(),
        fromMatch: match._id.toString(),
        matches: n,
        servedIn: servedIn.map((m) => m._id.toString()),
        remaining: n - servedIn.filter((m) => m.status === "finished").length,
      });
    });
  });
  return out;
};

/** Players banned from a given match. */
export const suspendedIn = (matchId: string, all: Suspension[]) =>
  all.filter((s) => s.servedIn.includes(matchId)).map((s) => s.player);

export interface MatchBanSanction {
  _id: Id;
  player?: Id | null;
  matches?: number;
  revokedAt?: Date | null;
  createdAt: Date;
}

/**
 * Extra match bans imposed by the Sports Club (§17.6), served in the
 * player's current team's next matches after the sanction.
 */
export const sanctionSuspensions = (
  sanctions: MatchBanSanction[],
  matches: ScheduledMatch[],
  teamOfPlayer: Map<string, string>,
): Suspension[] =>
  sanctions
    .filter((s) => !s.revokedAt && s.player && s.matches)
    .map((s) => {
      const player = s.player!.toString();
      const team = teamOfPlayer.get(player) ?? "";
      const later = [...matches]
        .filter(
          (m) =>
            (same(m.home, team) || same(m.away, team)) &&
            (m.kickoff?.getTime() ?? Infinity) > s.createdAt.getTime(),
        )
        .sort(chronological)
        .slice(0, s.matches);
      return {
        player,
        team,
        fromMatch: `sanction:${s._id.toString()}`,
        matches: s.matches!,
        servedIn: later.map((m) => m._id.toString()),
        remaining:
          s.matches! - later.filter((m) => m.status === "finished").length,
      };
    });
