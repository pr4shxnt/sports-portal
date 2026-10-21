/**
 * Season statistics from match centre records (Rules §10.3, §17.2, §19).
 * Pure functions: callers pass plain match/player data.
 */
import {
  EventLike,
  KickLike,
  MatchLike,
  ScheduledMatch,
  resultOf,
  scoreOf,
  suspendedIn,
  suspensions,
} from "./matchRules.js";

type Id = { toString(): string };
const key = (id?: Id | null) => (id ? id.toString() : "");

export interface StatsMatch extends ScheduledMatch {
  shootout: (KickLike & { player?: Id | null; saved?: boolean })[];
  goalkeepers?: { home?: Id | null; away?: Id | null };
}

export interface StatsPlayer {
  _id: Id;
  team: Id;
  position?: string;
}

/**
 * League Points earned per match (§17.2). The amounts are the proposed
 * defaults from the regulations and may change before the season.
 */
export const LP_VALUES = {
  eligible: 5,
  win: 20,
  draw: 10,
  goal: 3,
  cleanSheet: 5,
  penaltyScored: 2,
  penaltySaved: 5,
  noCards: 5,
} as const;

/** Fair play points of one card event (§10.3). */
const cardPoints = (e: EventLike) =>
  e.type === "yellow" ? 1 : e.type === "red" ? (e.secondYellow ? 1 : 3) : 0;
// A red after two yellows is 3 in total: the two yellows already gave 2.

const played = (m: StatsMatch) => m.status !== "scheduled";
const counted = (m: StatsMatch) => played(m) && !m.forfeitedBy;

/** Fair play points per team, over the given matches. */
export const fairPlayByTeam = (matches: StatsMatch[]) => {
  const points: Record<string, number> = {};
  for (const m of matches.filter(played))
    for (const e of m.events) {
      const p = cardPoints(e);
      if (p) points[key(e.team)] = (points[key(e.team)] ?? 0) + p;
    }
  return points;
};

/** Golden Boot: regulation-time goals; shootouts and own goals excluded. */
export const goldenBoot = (matches: StatsMatch[]) => {
  const rows = new Map<
    string,
    { player: string; team: string; goals: number; penalties: number }
  >();
  for (const m of matches.filter(counted))
    for (const e of m.events) {
      if ((e.type !== "goal" && e.type !== "penalty_goal") || !e.player)
        continue;
      const row = rows.get(key(e.player)) ?? {
        player: key(e.player),
        team: key(e.team),
        goals: 0,
        penalties: 0,
      };
      row.goals++;
      if (e.type === "penalty_goal") row.penalties++;
      rows.set(row.player, row);
    }
  return [...rows.values()].sort(
    (a, b) => b.goals - a.goals || a.penalties - b.penalties,
  );
};

/** The starting goalkeeper, or the squad's only goalkeeper when unrecorded. */
const keeperOf = (
  m: StatsMatch,
  side: "home" | "away",
  onlyKeeper: Map<string, string>,
) => key(m.goalkeepers?.[side]) || onlyKeeper.get(key(m[side])) || "";

/** Golden Glove: fewest goals conceded per match (§19). */
export const goldenGlove = (matches: StatsMatch[], players: StatsPlayer[]) => {
  const keepers = new Map<string, string[]>();
  players
    .filter((p) => p.position === "GK")
    .forEach((p) =>
      keepers.set(key(p.team), [
        ...(keepers.get(key(p.team)) ?? []),
        key(p._id),
      ]),
    );
  const onlyKeeper = new Map(
    [...keepers]
      .filter(([, ids]) => ids.length === 1)
      .map(([t, ids]) => [t, ids[0]]),
  );

  const rows = new Map<
    string,
    {
      player: string;
      team: string;
      matches: number;
      conceded: number;
      cleanSheets: number;
    }
  >();
  for (const m of matches.filter(
    (x) => x.status === "finished" && !x.forfeitedBy,
  )) {
    const score = scoreOf(m);
    for (const side of ["home", "away"] as const) {
      const gk = keeperOf(m, side, onlyKeeper);
      if (!gk) continue;
      const against = side === "home" ? score.away : score.home;
      const row = rows.get(gk) ?? {
        player: gk,
        team: key(m[side]),
        matches: 0,
        conceded: 0,
        cleanSheets: 0,
      };
      row.matches++;
      row.conceded += against;
      if (!against) row.cleanSheets++;
      rows.set(gk, row);
    }
  }
  const rate = (r: { matches: number; conceded: number }) =>
    r.conceded / r.matches;
  return [...rows.values()]
    .map((r) => ({ ...r, perMatch: Math.round(rate(r) * 100) / 100 }))
    .sort(
      (a, b) =>
        rate(a) - rate(b) ||
        b.cleanSheets - a.cleanSheets ||
        b.matches - a.matches,
    );
};

/** Cards and fair play points per team (Fair Play Award, §19). */
export const fairPlayTable = (matches: StatsMatch[], teamIds: string[]) => {
  const rows = new Map(
    teamIds.map((t) => [t, { team: t, yellows: 0, reds: 0, points: 0 }]),
  );
  for (const m of matches.filter(played))
    for (const e of m.events) {
      const row = rows.get(key(e.team));
      if (!row || !cardPoints(e)) continue;
      if (e.type === "yellow") row.yellows++;
      if (e.type === "red") row.reds++;
      row.points += cardPoints(e);
    }
  return [...rows.values()].sort(
    (a, b) => a.points - b.points || a.reds - b.reds,
  );
};

/** Cards per player, most points first. */
export const playerCards = (matches: StatsMatch[]) => {
  const rows = new Map<
    string,
    { player: string; team: string; yellows: number; reds: number }
  >();
  for (const m of matches.filter(played))
    for (const e of m.events) {
      if ((e.type !== "yellow" && e.type !== "red") || !e.player) continue;
      const row = rows.get(key(e.player)) ?? {
        player: key(e.player),
        team: key(e.team),
        yellows: 0,
        reds: 0,
      };
      if (e.type === "yellow") row.yellows++;
      else row.reds++;
      rows.set(row.player, row);
    }
  return [...rows.values()].sort(
    (a, b) => b.reds * 3 + b.yellows - (a.reds * 3 + a.yellows),
  );
};

type LpRow = {
  team: string;
  matches: number;
  eligible: number;
  results: number;
  goals: number;
  cleanSheets: number;
  penaltiesScored: number;
  penaltiesSaved: number;
  noCards: number;
  total: number;
};

/** League Points earned per team from finished matches (§17.2). */
export const leaguePoints = (matches: StatsMatch[], teamIds: string[]) => {
  const rows = new Map<string, LpRow>(
    teamIds.map((t) => [
      t,
      {
        team: t,
        matches: 0,
        eligible: 0,
        results: 0,
        goals: 0,
        cleanSheets: 0,
        penaltiesScored: 0,
        penaltiesSaved: 0,
        noCards: 0,
        total: 0,
      },
    ]),
  );
  const bans = suspensions(matches);

  for (const m of matches.filter((x) => x.status === "finished")) {
    const result = resultOf(m as MatchLike);
    const banned = new Set(suspendedIn(key(m._id), bans));
    const score = scoreOf(m);
    for (const side of ["home", "away"] as const) {
      const team = key(m[side]);
      const row = rows.get(team);
      if (!row) continue;
      row.matches++;
      if (m.forfeitedBy) {
        // A forfeit winner earns the win only; the forfeiting team nothing.
        if (result === team) row.results += LP_VALUES.win;
        continue;
      }
      const opp = side === "home" ? "away" : "home";
      const mine = (e: EventLike) => key(e.team) === team;
      const fieldedBanned = m.events.some(
        (e) => mine(e) && e.player && banned.has(key(e.player)),
      );
      if (!fieldedBanned) row.eligible += LP_VALUES.eligible;
      if (result === team) row.results += LP_VALUES.win;
      else if (result === "DRAW") row.results += LP_VALUES.draw;
      row.goals += LP_VALUES.goal * score[side];
      if (score[opp] === 0) row.cleanSheets += LP_VALUES.cleanSheet;
      row.penaltiesScored +=
        LP_VALUES.penaltyScored *
        (m.events.filter((e) => mine(e) && e.type === "penalty_goal").length +
          m.shootout.filter((k) => key(k.team) === team && k.scored).length);
      row.penaltiesSaved +=
        LP_VALUES.penaltySaved *
        (m.events.filter(
          (e) => !mine(e) && e.type === "penalty_missed" && e.saved,
        ).length +
          m.shootout.filter((k) => key(k.team) !== team && !k.scored && k.saved)
            .length);
      if (
        !m.events.some(
          (e) => mine(e) && (e.type === "yellow" || e.type === "red"),
        )
      )
        row.noCards += LP_VALUES.noCards;
    }
  }
  return [...rows.values()]
    .map((r) => ({
      ...r,
      total:
        r.eligible +
        r.results +
        r.goals +
        r.cleanSheets +
        r.penaltiesScored +
        r.penaltiesSaved +
        r.noCards,
    }))
    .sort((a, b) => b.total - a.total);
};

export { suspensions };
