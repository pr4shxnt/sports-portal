import { Request, Response } from "express";
import mongoose from "mongoose";
import Competition from "../models/Competition.js";
import Draw, { IDraw } from "../models/Draw.js";
import Match, { IMatch, MatchStatus } from "../models/Match.js";
import Player from "../models/Player.js";
import Sanction from "../models/Sanction.js";
import Team from "../models/Team.js";
import {
  isSecondYellow,
  sanctionSuspensions,
  needsShootout,
  resultOf,
  scoreString,
  suspendedIn,
  suspensions,
} from "../utils/matchRules.js";
import {
  LP_VALUES,
  StatsMatch,
  fairPlayByTeam,
  fairPlayTable,
  goldenBoot,
  goldenGlove,
  leaguePoints,
  playerCards,
} from "../utils/stats.js";

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ message: error.message });
      }
      if ((error as any)?.code === 11000) {
        return res.status(409).json({ message: "This match already exists" });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  };

const same = (a: unknown, b: unknown) => String(a) === String(b);
const ADMIN_PLAYER = "team name shirtNumber position captaincy photo";
const PUBLIC_PLAYER = ADMIN_PLAYER;

/** Draw score/result maps are Mongoose Maps at runtime. */
const mapOf = (draw: IDraw, field: "matchScores" | "matchResults") =>
  draw[field] as unknown as Map<string, string>;

const findMatch = async (competitionId: string, matchDocId: string) => {
  if (!mongoose.isValidObjectId(matchDocId)) {
    throw new HttpError(404, "Match not found");
  }
  const match = await Match.findOne({
    _id: matchDocId,
    competition: competitionId,
  });
  if (!match) throw new HttpError(404, "Match not found");
  return match;
};

/** Next-round fixture a knockout winner feeds into ("r8m3" → "r4m1"). */
const nextKnockoutId = (matchId: string) => {
  const m = matchId.match(/^r(\d+)m(\d+)$/);
  if (!m || Number(m[1]) <= 2) return null;
  return `r${Number(m[1]) / 2}m${Math.floor(Number(m[2]) / 2)}`;
};

/** Results that later phases depend on can't change underneath them. */
const ensureEditable = async (match: IMatch, draw: IDraw) => {
  if (await Draw.exists({ parentDraw: draw._id })) {
    throw new HttpError(
      400,
      "This phase has already advanced, so its results are locked.",
    );
  }
  const next = match.knockout ? nextKnockoutId(match.matchId) : null;
  if (
    next &&
    (mapOf(draw, "matchResults").get(next) ||
      mapOf(draw, "matchScores").get(next))
  ) {
    throw new HttpError(
      400,
      "The next round has started, so this result is locked.",
    );
  }
};

/** Writes the derived score/result into the draw the tables read from. */
const syncDraw = async (match: IMatch, draw: IDraw) => {
  const hasPlay =
    match.events.some((e) =>
      ["goal", "penalty_goal", "own_goal"].includes(e.type),
    ) ||
    match.status !== "scheduled" ||
    !!match.forfeitedBy;

  const scores = mapOf(draw, "matchScores");
  const results = mapOf(draw, "matchResults");
  if (hasPlay) scores.set(match.matchId, scoreString(match));
  else scores.delete(match.matchId);

  const result = match.status === "finished" ? resultOf(match) : null;
  if (result) results.set(match.matchId, result);
  else results.delete(match.matchId);

  // Fair play is the last table tie-breaker (§10.3): keep it per phase.
  const inPhase = await Match.find({ draw: draw._id }).lean();
  draw.fairPlay = new Map(
    Object.entries(
      fairPlayByTeam(
        inPhase.map((m) => (m._id.equals(match._id) ? match : m)) as any,
      ),
    ),
  ) as any;

  await draw.save();
};

const loadForEdit = async (req: Request) => {
  const match = await findMatch(req.params.id, req.params.matchDocId);
  const draw = await Draw.findById(match.draw);
  if (!draw) throw new HttpError(404, "Phase not found");
  await ensureEditable(match, draw);
  return { match, draw };
};

/** Red-card bans (§13.2) plus Sports Club match bans (§17.6). */
const allSuspensions = async (competitionId: unknown, matches?: any[]) => {
  const [all, bans, players] = await Promise.all([
    matches ?? Match.find({ competition: competitionId }).lean(),
    Sanction.find({ competition: competitionId, kind: "match_ban" }).lean(),
    Player.find({ competition: competitionId }).select("team").lean(),
  ]);
  const teamOf = new Map(players.map((p) => [String(p._id), String(p.team)]));
  return {
    cards: suspensions(all as any),
    sanctions: sanctionSuspensions(bans as any, all as any, teamOf),
  };
};

/** Match with names, both squads and who is suspended for it. */
const detail = async (match: IMatch, playerFields: string) => {
  // Players named in this match's events stay resolvable after transfers.
  const involved = [...match.events, ...match.shootout]
    .map((e) => e.player)
    .filter(Boolean);
  const [teams, players, all] = await Promise.all([
    Team.find({ _id: { $in: [match.home, match.away] } })
      .select("name")
      .lean(),
    Player.find({
      $or: [
        { team: { $in: [match.home, match.away] } },
        { _id: { $in: involved } },
      ],
    })
      .select(playerFields)
      .sort({ order: 1 })
      .lean(),
    Match.find({ competition: match.competition }).lean(),
  ]);
  const bans = await allSuspensions(match.competition, all);
  const draw = await Draw.findById(match.draw).select("stage").lean();
  return {
    match,
    stage: draw?.stage,
    home: teams.find((t) => same(t._id, match.home)),
    away: teams.find((t) => same(t._id, match.away)),
    players,
    suspended: suspendedIn(String(match._id), [
      ...bans.cards,
      ...bans.sanctions,
    ]),
    score: scoreString(match),
    needsShootout: needsShootout(match),
    result: resultOf(match),
  };
};

const ensureCompetition = async (id: string) => {
  if (!mongoose.isValidObjectId(id) || !(await Competition.exists({ _id: id })))
    throw new HttpError(404, "Competition not found");
};

/** Score for a list row whose home/away were populated with names. */
const listScore = (m: any, events: unknown, shootout: unknown) =>
  scoreString({
    home: m.home?._id ?? m.home,
    away: m.away?._id ?? m.away,
    knockout: m.knockout,
    forfeitedBy: m.forfeitedBy,
    events,
    shootout,
  } as any);

/* ───────────────────────────── Admin ───────────────────────────── */

// @desc    Every match centre record of a competition
// @route   GET /api/competitions/:id/matches
export const listMatches = handle(async (req, res) => {
  await ensureCompetition(req.params.id);
  const matches = await Match.find({ competition: req.params.id })
    .populate("home away", "name")
    .populate("draw", "stage")
    .sort({ kickoff: 1, createdAt: 1 })
    .lean();
  res.json(
    matches.map(({ events, shootout, ...m }) => ({
      ...m,
      score: listScore(m, events, shootout),
    })),
  );
});

// @desc    Open (create on first use) the match for a draw fixture
// @route   POST /api/competitions/:id/matches/open { drawId, matchId, home, away }
export const openMatch = handle(async (req, res) => {
  const { drawId, matchId, home, away } = req.body;
  const draw = await Draw.findOne({
    _id: drawId,
    competition: req.params.id,
  });
  if (!draw) throw new HttpError(404, "Phase not found in this competition");

  let match = await Match.findOne({ draw: draw._id, matchId });
  if (!match) {
    const teams = draw.drawnTeams.map(String);
    if (same(home, away) || !teams.includes(home) || !teams.includes(away)) {
      throw new HttpError(400, "Both teams must be in this phase");
    }
    const knockout = draw.format === "Knockout";
    if (
      knockout ? !/^r\d+m\d+$/.test(matchId) : !matchId.startsWith("group_")
    ) {
      throw new HttpError(400, "Unknown fixture");
    }
    try {
      match = await Match.create({
        competition: req.params.id,
        draw: draw._id,
        matchId,
        home,
        away,
        knockout,
      });
    } catch (error) {
      // Opened twice at once: the other request created it.
      if ((error as any)?.code !== 11000) throw error;
      match = (await Match.findOne({ draw: draw._id, matchId }))!;
    }
  }
  res.json(await detail(match, ADMIN_PLAYER));
});

// @desc    Match details for the match centre
// @route   GET /api/competitions/:id/matches/:matchDocId
export const getMatch = handle(async (req, res) => {
  const match = await findMatch(req.params.id, req.params.matchDocId);
  res.json(await detail(match, ADMIN_PLAYER));
});

// @desc    Schedule, status and forfeit
// @route   PATCH /api/competitions/:id/matches/:matchDocId
export const updateMatch = handle(async (req, res) => {
  const { kickoff, venue, status, forfeitedBy, goalkeepers } = req.body as {
    kickoff?: string | null;
    venue?: string;
    status?: MatchStatus;
    forfeitedBy?: string | null;
    goalkeepers?: { home?: string | null; away?: string | null };
  };
  const match = await findMatch(req.params.id, req.params.matchDocId);

  // Scheduling never touches results, so it's allowed even when locked.
  if (kickoff !== undefined)
    match.kickoff = kickoff ? new Date(kickoff) : undefined;
  if (venue !== undefined) match.venue = venue;
  if (goalkeepers) {
    for (const side of ["home", "away"] as const) {
      const gk = goalkeepers[side];
      if (gk === undefined) continue;
      await ensurePlayerOf(gk, match[side]);
      match.set(`goalkeepers.${side}`, gk || null);
    }
  }

  const touchesResult = status !== undefined || forfeitedBy !== undefined;
  if (touchesResult) {
    const draw = await Draw.findById(match.draw);
    if (!draw) throw new HttpError(404, "Phase not found");
    await ensureEditable(match, draw);

    if (forfeitedBy !== undefined) {
      if (
        forfeitedBy &&
        !same(forfeitedBy, match.home) &&
        !same(forfeitedBy, match.away)
      ) {
        throw new HttpError(400, "Only a team in this match can forfeit");
      }
      match.forfeitedBy = (forfeitedBy as any) || null;
      if (forfeitedBy) match.status = "finished";
    }
    if (status !== undefined) {
      if (status === "finished" && !resultOf(match)) {
        throw new HttpError(
          400,
          "A level knockout match needs a decided penalty shootout before it can finish.",
        );
      }
      match.status = status;
    }
    await match.save();
    await syncDraw(match, draw);
  } else {
    await match.save();
  }
  res.json(await detail(match, ADMIN_PLAYER));
});

const ensureNotFinished = (match: IMatch) => {
  if (match.status === "finished") {
    throw new HttpError(
      400,
      "This match is finished. Reopen it to change events.",
    );
  }
};

const ensurePlayerOf = async (player: unknown, team: unknown) => {
  if (!player) return;
  if (!(await Player.exists({ _id: player, team }))) {
    throw new HttpError(400, "That player isn't in this team's squad");
  }
};

// @desc    Add a goal, card or penalty to the timeline
// @route   POST /api/competitions/:id/matches/:matchDocId/events
export const addEvent = handle(async (req, res) => {
  const { match, draw } = await loadForEdit(req);
  ensureNotFinished(match);
  const { type, team, player, minute, saved } = req.body;
  if (!same(team, match.home) && !same(team, match.away)) {
    throw new HttpError(400, "The team must be one of the two in this match");
  }
  await ensurePlayerOf(player, team);
  if (["yellow", "red", "penalty_missed"].includes(type) && !player) {
    throw new HttpError(400, "Choose the player");
  }

  const eventId = new mongoose.Types.ObjectId();
  // Two yellows in a match count as one red card (§13.1).
  const secondYellow =
    type === "yellow" && isSecondYellow(match.events, player, minute);
  match.events.push({
    _id: eventId,
    type,
    team,
    player: player || undefined,
    minute,
    saved: type === "penalty_missed" ? !!saved : undefined,
  } as any);
  if (secondYellow) {
    match.events.push({
      type: "red",
      team,
      player,
      minute,
      secondYellow: true,
      causedBy: eventId,
    } as any);
  }
  match.events.sort((a, b) => a.minute - b.minute);
  if (match.status === "scheduled") match.status = "live";
  await match.save();
  await syncDraw(match, draw);
  res.status(201).json(await detail(match, ADMIN_PLAYER));
});

// @desc    Remove an event (and the red card a second yellow created)
// @route   DELETE /api/competitions/:id/matches/:matchDocId/events/:eventId
export const removeEvent = handle(async (req, res) => {
  const { match, draw } = await loadForEdit(req);
  ensureNotFinished(match);
  const id = req.params.eventId;
  const before = match.events.length;
  match.events = match.events.filter(
    (e) => !same(e._id, id) && !same(e.causedBy, id),
  ) as any;
  if (match.events.length === before)
    throw new HttpError(404, "Event not found");
  await match.save();
  await syncDraw(match, draw);
  res.json(await detail(match, ADMIN_PLAYER));
});

// @desc    Replace the shootout kicks (knockout, level after regulation)
// @route   PUT /api/competitions/:id/matches/:matchDocId/shootout { kicks }
export const saveShootout = handle(async (req, res) => {
  const { match, draw } = await loadForEdit(req);
  ensureNotFinished(match);
  if (!needsShootout(match)) {
    throw new HttpError(
      400,
      "A shootout is only for a knockout match level after regulation time.",
    );
  }
  const kicks: {
    team: string;
    player?: string;
    scored: boolean;
    saved?: boolean;
  }[] = req.body.kicks ?? [];
  for (const k of kicks) {
    if (!same(k.team, match.home) && !same(k.team, match.away)) {
      throw new HttpError(
        400,
        "Every kick must be taken by one of the two teams",
      );
    }
    await ensurePlayerOf(k.player, k.team);
  }
  match.shootout = kicks.map((k) => ({
    team: k.team,
    player: k.player || undefined,
    scored: !!k.scored,
    saved: !k.scored && !!k.saved,
  })) as any;
  await match.save();
  await syncDraw(match, draw);
  res.json(await detail(match, ADMIN_PLAYER));
});

/* ───────────────────────────── Public ───────────────────────────── */

const publicCompetition = async (slug: string) => {
  const competition = await Competition.findOne({
    formSlug: String(slug).toLowerCase(),
  })
    .select("_id")
    .lean();
  if (!competition) throw new HttpError(404, "Competition not found");
  return competition;
};

// @desc    Fixtures and results with kick-off times
// @route   GET /api/competitions/public/:slug/matches
export const listPublicMatches = handle(async (req, res) => {
  const competition = await publicCompetition(req.params.slug);
  const matches = await Match.find({ competition: competition._id })
    .populate("home away", "name")
    .populate("draw", "stage")
    .sort({ kickoff: 1, createdAt: 1 })
    .lean();
  res.json(
    matches.map(({ events, shootout, ...m }) => ({
      ...m,
      score: listScore(m, events, shootout),
    })),
  );
});

// @desc    One match: timeline, shootout and squads (names/photos only)
// @route   GET /api/competitions/public/:slug/matches/:matchDocId
export const getPublicMatch = handle(async (req, res) => {
  const competition = await publicCompetition(req.params.slug);
  const match = await findMatch(String(competition._id), req.params.matchDocId);
  res.json(await detail(match, PUBLIC_PLAYER));
});

/* ───────────────────────────── Stats ───────────────────────────── */

const statsFor = async (competitionId: unknown) => {
  const [matches, players, teams] = await Promise.all([
    Match.find({ competition: competitionId }).lean(),
    Player.find({ competition: competitionId }).select(PUBLIC_PLAYER).lean(),
    Team.find({ competition: competitionId }).select("name").lean(),
  ]);
  const all = matches as unknown as StatsMatch[];
  const teamIds = teams.map((t) => String(t._id));
  const bans = await allSuspensions(competitionId, matches);
  return {
    teams,
    players,
    goldenBoot: goldenBoot(all),
    goldenGlove: goldenGlove(all, players as any),
    fairPlay: fairPlayTable(all, teamIds),
    cards: playerCards(all),
    suspensions: [...bans.cards, ...bans.sanctions].filter(
      (s) => s.remaining > 0,
    ),
    leaguePoints: leaguePoints(all, teamIds, bans.sanctions),
    lpValues: LP_VALUES,
    matchesPlayed: all.filter((m) => m.status === "finished").length,
  };
};

// @desc    Season stats: Golden Boot/Glove, fair play, cards, League Points
// @route   GET /api/competitions/:id/stats
export const getStats = handle(async (req, res) => {
  await ensureCompetition(req.params.id);
  res.json(await statsFor(req.params.id));
});

// @route   GET /api/competitions/public/:slug/stats
export const getPublicStats = handle(async (req, res) => {
  const competition = await publicCompetition(req.params.slug);
  res.json(await statsFor(competition._id));
});
