import { Request, Response } from "express";
import Competition, {
  CompetitionStatus,
  ICompetition,
} from "../models/Competition.js";
import Draw from "../models/Draw.js";
import Form from "../models/Form.js";
import FormSubmission, {
  IFormSubmission,
  SubmissionStatus,
} from "../models/FormSubmission.js";
import Team, { TeamType } from "../models/Team.js";
import Player, { IPlayer } from "../models/Player.js";
import Match from "../models/Match.js";
import NewsPost from "../models/NewsPost.js";
import { deleteCompetitionNews } from "./newsController.js";
import { shuffle } from "../utils/tournament.js";
import { destroyImage, isOwnImage } from "../utils/cloudinary.js";
import { teamFromSubmission } from "../utils/submissionTeam.js";

/* ───────────────────────────── Helpers ───────────────────────────── */

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
        return res
          .status(409)
          .json({ message: "That name or form slug is already in use" });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  };

/** Draw population; public views get team names only (no contact details). */
const drawPopulate = (fields: string) => [
  { path: "drawnTeams", select: fields },
  { path: "groupings.teams", select: fields },
  {
    path: "bracketSlots",
    select: fields,
    options: { retainNullValues: true },
  },
  { path: "directQualifiers", select: fields },
];
const ADMIN_TEAM_FIELDS = "name sport teamType";
const PUBLIC_TEAM_FIELDS = "name";

const findCompetition = async (id: string) => {
  const competition = await Competition.findById(id);
  if (!competition) throw new HttpError(404, "Competition not found");
  return competition;
};

const ensureSetup = (competition: ICompetition) => {
  if (competition.status !== CompetitionStatus.SETUP) {
    throw new HttpError(
      400,
      "The league has started, so the team list is locked. Reset the competition to change teams.",
    );
  }
};

/** "Falcons", "Falcons (2)", ... so two applications can share a name. */
const uniqueName = (name: string, taken: Set<string>) => {
  let candidate = name;
  for (let n = 2; taken.has(candidate.toLowerCase()); n++) {
    candidate = `${name} (${n})`;
  }
  taken.add(candidate.toLowerCase());
  return candidate;
};

type PlayerInput = Partial<
  Pick<
    IPlayer,
    | "name"
    | "email"
    | "phone"
    | "studentId"
    | "programme"
    | "intake"
    | "position"
  >
> & {
  _id?: string;
  shirtNumber?: number | null;
  captaincy?: "captain" | "vice" | null;
  photo?: { url: string; publicId: string } | null;
};

/** Squad rules from the regulations that the data itself must respect. */
const validateSquad = (players: PlayerInput[]) => {
  const numbers = players
    .map((p) => p.shirtNumber)
    .filter((n): n is number => n != null);
  if (new Set(numbers).size !== numbers.length) {
    throw new HttpError(400, "Two players can't wear the same shirt number");
  }
  for (const role of ["captain", "vice"] as const) {
    if (players.filter((p) => p.captaincy === role).length > 1) {
      throw new HttpError(
        400,
        `Only one ${role === "captain" ? "captain" : "vice-captain"} per team`,
      );
    }
  }
  for (const p of players) {
    if (p.photo && !isOwnImage(p.photo.url, p.photo.publicId)) {
      throw new HttpError(
        400,
        "Player photos must be uploaded through the portal",
      );
    }
  }
};

const playerDoc = (
  competition: ICompetition,
  teamId: unknown,
  p: PlayerInput,
  order: number,
) => ({
  competition: competition._id,
  team: teamId,
  name: p.name!.trim(),
  email: p.email?.trim() || undefined,
  phone: p.phone?.trim() || undefined,
  studentId: p.studentId?.trim() || undefined,
  programme: p.programme?.trim() || undefined,
  intake: p.intake?.trim() || undefined,
  shirtNumber: p.shirtNumber ?? undefined,
  position: p.position ?? "FP",
  captaincy: p.captaincy ?? null,
  photo: p.photo ?? undefined,
  order,
});

/** Creates teams (and their players) from approved applications. */
const createTeamsFromApproved = async (
  competition: ICompetition,
  submissions: IFormSubmission[],
  fields: any[],
  taken: Set<string>,
) => {
  if (!submissions.length) return 0;
  const parsed = submissions.map((s) => ({
    submission: s,
    ...teamFromSubmission(s.data, fields),
  }));
  const teams = await Team.insertMany(
    parsed.map((t) => ({
      name: uniqueName(t.name, taken),
      sport: competition.sport,
      teamType: TeamType.LEAGUE,
      competition: competition._id,
      formSubmission: t.submission._id,
      members: [],
    })),
  );
  await Player.insertMany(
    teams.flatMap((team, i) =>
      parsed[i].members
        .filter((m) => m.name)
        .map((m, order) => playerDoc(competition, team._id, m, order)),
    ),
  );
  return teams.length;
};

/** Deletes teams with their players and any uploaded photos. */
const deleteTeams = async (filter: Record<string, unknown>) => {
  const teams = await Team.find(filter).select("_id");
  if (!teams.length) return 0;
  const ids = teams.map((t) => t._id);
  const players = await Player.find({ team: { $in: ids } }).select("photo");
  await Promise.all([
    Player.deleteMany({ team: { $in: ids } }),
    Team.deleteMany({ _id: { $in: ids } }),
  ]);
  await Promise.all(players.map((p) => destroyImage(p.photo?.publicId)));
  return teams.length;
};

/**
 * Brings the team list in line with the form: one team per approved
 * application. Teams whose application is no longer approved are removed;
 * manually added teams (no application) and manual edits are kept.
 */
const syncFromForm = async (competition: ICompetition) => {
  const form = await Form.findOne({ formId: competition.formSlug }).lean();
  if (!form) {
    throw new HttpError(
      404,
      `No form found with slug "${competition.formSlug}"`,
    );
  }

  const [approved, teams] = await Promise.all([
    FormSubmission.find({
      form: form._id,
      status: SubmissionStatus.APPROVED,
    }).sort({ submittedAt: 1 }),
    Team.find({ competition: competition._id }).select("name formSubmission"),
  ]);

  const approvedIds = new Set(approved.map((s) => s._id.toString()));
  const linked = new Set(
    teams.map((t) => t.formSubmission?.toString()).filter(Boolean),
  );

  const stale = teams.filter(
    (t) => t.formSubmission && !approvedIds.has(t.formSubmission.toString()),
  );
  const taken = new Set(
    teams.filter((t) => !stale.includes(t)).map((t) => t.name.toLowerCase()),
  );
  const removed = stale.length
    ? await deleteTeams({ _id: { $in: stale.map((t) => t._id) } })
    : 0;
  const added = await createTeamsFromApproved(
    competition,
    approved.filter((s) => !linked.has(s._id.toString())),
    form.fields,
    taken,
  );

  return { added, removed };
};

/**
 * Called after a submission is reviewed: keeps a Champions League in setup in
 * step with approvals. Never throws — reviewing must not fail because of it.
 */
export const syncCompetitionTeam = async (submission: IFormSubmission) => {
  try {
    const form = submission.form as any;
    if (!form?.formId) return;
    const competition = await Competition.findOne({
      formSlug: form.formId,
      status: CompetitionStatus.SETUP,
    });
    if (!competition) return;

    const existing = await Team.findOne({
      competition: competition._id,
      formSubmission: submission._id,
    });

    if (submission.status !== SubmissionStatus.APPROVED) {
      if (existing) await deleteTeams({ _id: existing._id });
      return;
    }
    if (existing) return;

    const names = await Team.find({ competition: competition._id }).distinct(
      "name",
    );
    await createTeamsFromApproved(
      competition,
      [submission],
      form.fields,
      new Set(names.map((n: string) => n.toLowerCase())),
    );
  } catch (error) {
    console.error("[Champions League] Team sync failed:", error);
  }
};

const PUBLIC_PLAYER_FIELDS = "team name shirtNumber position captaincy photo";

/** Teams with their squads attached as `players`. */
const teamsWithPlayers = async (
  competitionId: unknown,
  teamFields: string,
  playerFields?: string,
) => {
  const [teams, players] = await Promise.all([
    Team.find({ competition: competitionId })
      .select(teamFields)
      .sort({ createdAt: 1 })
      .lean(),
    Player.find({ competition: competitionId })
      .select(playerFields ?? "-competition -__v")
      .sort({ order: 1, createdAt: 1 })
      .lean(),
  ]);
  const byTeam = new Map<string, typeof players>();
  players.forEach((p) => {
    const key = String(p.team);
    byTeam.set(key, [...(byTeam.get(key) ?? []), p]);
  });
  return teams.map((t) => ({ ...t, players: byTeam.get(String(t._id)) ?? [] }));
};

const detail = async (competition: ICompetition) => {
  const [teams, draws, form] = await Promise.all([
    teamsWithPlayers(competition._id, "name formSubmission createdAt"),
    Draw.find({ competition: competition._id })
      .populate(drawPopulate(ADMIN_TEAM_FIELDS))
      .sort({ createdAt: 1 })
      .lean(),
    Form.findOne({ formId: competition.formSlug })
      .select("formId formTitle isActive")
      .lean(),
  ]);
  return { competition, teams, draws, form };
};

/* ───────────────────────────── Admin ───────────────────────────── */

// @desc    Check a form slug before linking it
// @route   GET /api/competitions/forms/:slug
// @access  Admin
export const previewForm = handle(async (req, res) => {
  const formId = String(req.params.slug).toLowerCase().trim();
  const form = await Form.findOne({ formId })
    .select("formId formTitle isActive")
    .lean();
  if (!form) throw new HttpError(404, `No form found with slug "${formId}"`);

  const [counts, linked] = await Promise.all([
    FormSubmission.aggregate([
      { $match: { form: form._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Competition.findOne({ formSlug: formId }).select("name").lean(),
  ]);
  const count = (status: string) =>
    counts.find((c) => c._id === status)?.count ?? 0;

  res.json({
    ...form,
    approved: count(SubmissionStatus.APPROVED),
    pending: count(SubmissionStatus.PENDING),
    rejected: count(SubmissionStatus.REJECTED),
    linkedTo: linked ? { _id: linked._id, name: linked.name } : null,
  });
});

// @desc    List competitions
// @route   GET /api/competitions
// @access  Admin
export const listCompetitions = handle(async (_req, res) => {
  const [competitions, counts] = await Promise.all([
    Competition.find().sort({ createdAt: -1 }).lean(),
    Team.aggregate([
      { $match: { teamType: TeamType.LEAGUE } },
      { $group: { _id: "$competition", count: { $sum: 1 } } },
    ]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json(
    competitions.map((c) => ({
      ...c,
      teamCount: byId.get(String(c._id)) ?? 0,
    })),
  );
});

// @desc    Create a competition linked to a form and pull in its teams
// @route   POST /api/competitions
// @access  Admin
export const createCompetition = handle(async (req, res) => {
  const { name, season, sport, description, formSlug } = req.body;
  const formId = String(formSlug).toLowerCase().trim();
  if (!(await Form.exists({ formId }))) {
    throw new HttpError(404, `No form found with slug "${formId}"`);
  }
  if (await Competition.exists({ formSlug: formId })) {
    throw new HttpError(409, "That form is already linked to a competition");
  }

  const competition = await Competition.create({
    name,
    season,
    sport,
    description,
    formSlug: formId,
    createdBy: req.user?._id,
  });
  const sync = await syncFromForm(competition);
  res.status(201).json({ ...(await detail(competition)), sync });
});

// @desc    Competition with its teams (incl. players) and phases
// @route   GET /api/competitions/:id
// @access  Admin
export const getCompetition = handle(async (req, res) => {
  res.json(await detail(await findCompetition(req.params.id)));
});

// @desc    Edit details; the form can only change before the league starts
// @route   PATCH /api/competitions/:id
// @access  Admin
export const updateCompetition = handle(async (req, res) => {
  const competition = await findCompetition(req.params.id);
  const { name, season, sport, description, formSlug } = req.body;

  if (name !== undefined) competition.name = name;
  if (season !== undefined) competition.season = season;
  if (description !== undefined) competition.description = description;
  if (sport !== undefined && sport !== competition.sport) {
    competition.sport = sport;
    await Team.updateMany({ competition: competition._id }, { sport });
  }

  let sync;
  const newSlug = formSlug?.toLowerCase().trim();
  if (newSlug && newSlug !== competition.formSlug) {
    ensureSetup(competition);
    if (!(await Form.exists({ formId: newSlug }))) {
      throw new HttpError(404, `No form found with slug "${newSlug}"`);
    }
    // Applications belong to the old form: drop them, keep manual teams.
    await deleteTeams({
      competition: competition._id,
      formSubmission: { $exists: true },
    });
    competition.formSlug = newSlug;
    await competition.save();
    sync = await syncFromForm(competition);
  } else {
    await competition.save();
  }

  res.json({ ...(await detail(competition)), sync });
});

// @desc    Delete a competition with its teams and phases
// @route   DELETE /api/competitions/:id
// @access  Admin
export const deleteCompetition = handle(async (req, res) => {
  const competition = await findCompetition(req.params.id);
  await Promise.all([
    Draw.deleteMany({ competition: competition._id }),
    Match.deleteMany({ competition: competition._id }),
    deleteTeams({ competition: competition._id }),
    deleteCompetitionNews(competition._id),
  ]);
  await competition.deleteOne();
  res.json({ message: "Competition deleted" });
});

// @desc    Pull approved applications into the team list
// @route   POST /api/competitions/:id/sync
// @access  Admin
export const syncTeams = handle(async (req, res) => {
  const competition = await findCompetition(req.params.id);
  ensureSetup(competition);
  const sync = await syncFromForm(competition);
  res.json({ ...(await detail(competition)), sync });
});

// @desc    Add a team by hand (e.g. a late entry)
// @route   POST /api/competitions/:id/teams
// @access  Admin
export const addTeam = handle(async (req, res) => {
  const competition = await findCompetition(req.params.id);
  ensureSetup(competition);
  const players: PlayerInput[] = req.body.players ?? [];
  validateSquad(players);
  const team = await Team.create({
    name: req.body.name,
    sport: competition.sport,
    teamType: TeamType.LEAGUE,
    competition: competition._id,
    members: [],
  });
  await Player.insertMany(
    players.map((p, i) => playerDoc(competition, team._id, p, i)),
  );
  res.status(201).json(await detail(competition));
});

// @desc    Rename a team or edit its players (allowed during the league)
// @route   PUT /api/competitions/:id/teams/:teamId
// @access  Admin
export const updateTeam = handle(async (req, res) => {
  const competition = await findCompetition(req.params.id);
  const team = await Team.findOne({
    _id: req.params.teamId,
    competition: competition._id,
  });
  if (!team) throw new HttpError(404, "Team not found in this competition");

  team.name = req.body.name;
  await team.save();

  if (req.body.players) {
    const players: PlayerInput[] = req.body.players;
    validateSquad(players);
    const existing = await Player.find({ team: team._id });
    const byId = new Map(existing.map((p) => [p._id.toString(), p]));
    const kept = new Set<string>();
    const replacedPhotos: (string | undefined)[] = [];

    // Existing players keep their ids, so match events stay linked.
    const writes = players.map((p, order) => {
      const doc = playerDoc(competition, team._id, p, order);
      const current = p._id ? byId.get(p._id) : undefined;
      if (!current) return { insertOne: { document: doc } };
      kept.add(p._id!);
      if (current.photo?.publicId !== doc.photo?.publicId) {
        replacedPhotos.push(current.photo?.publicId);
      }
      // Unset cleared optional fields instead of storing undefined.
      const unset = Object.fromEntries(
        Object.entries(doc)
          .filter(([, v]) => v === undefined)
          .map(([k]) => [k, ""]),
      );
      return {
        updateOne: {
          filter: { _id: current._id },
          update: {
            $set: doc,
            ...(Object.keys(unset).length && { $unset: unset }),
          },
        },
      };
    });
    const removed = existing.filter((p) => !kept.has(p._id.toString()));
    const removedIds = removed.map((p) => p._id);
    if (
      removedIds.length &&
      (await Match.exists({
        $or: [
          { "events.player": { $in: removedIds } },
          { "shootout.player": { $in: removedIds } },
        ],
      }))
    ) {
      throw new HttpError(
        400,
        "A player you removed already has goals or cards in a match. Remove those events first.",
      );
    }
    removed.forEach((p) => replacedPhotos.push(p.photo?.publicId));

    if (writes.length) await Player.bulkWrite(writes as any);
    if (removed.length) {
      await Player.deleteMany({ _id: { $in: removed.map((p) => p._id) } });
    }
    await Promise.all(replacedPhotos.map((id) => destroyImage(id)));
  }
  res.json(await detail(competition));
});

// @desc    Remove a team (before the league starts)
// @route   DELETE /api/competitions/:id/teams/:teamId
// @access  Admin
export const removeTeam = handle(async (req, res) => {
  const competition = await findCompetition(req.params.id);
  ensureSetup(competition);
  const removed = await deleteTeams({
    _id: req.params.teamId,
    competition: competition._id,
  });
  if (!removed) throw new HttpError(404, "Team not found in this competition");
  res.json(await detail(competition));
});

// @desc    Lock the teams and create the league table (3 / 1 / 0)
// @route   POST /api/competitions/:id/start
// @access  Admin
export const startLeague = handle(async (req, res) => {
  const competition = await findCompetition(req.params.id);
  ensureSetup(competition);

  const teams = await Team.find({ competition: competition._id }).select("_id");
  if (teams.length < 4) {
    throw new HttpError(400, "A league needs at least 4 teams");
  }
  // Random order: it fixes the fixture list and is the last tie-breaker.
  const teamIds = shuffle(teams.map((t) => t._id.toString()));

  await Draw.create({
    competition: competition._id,
    format: "League",
    stage: "League Phase",
    sport: competition.sport,
    scoring: "football",
    drawnTeams: teamIds,
    groupings: [{ name: "League", teams: teamIds }],
    createdBy: req.user?._id,
  });
  competition.status = CompetitionStatus.LIVE;
  await competition.save();
  res.status(201).json(await detail(competition));
});

// @desc    Delete every phase and unlock the team list
// @route   POST /api/competitions/:id/reset
// @access  Admin
export const resetCompetition = handle(async (req, res) => {
  const competition = await findCompetition(req.params.id);
  await Promise.all([
    Draw.deleteMany({ competition: competition._id }),
    Match.deleteMany({ competition: competition._id }),
    // Posts survive a reset; their match links don't.
    NewsPost.updateMany({ competition: competition._id }, { match: null }),
  ]);
  competition.status = CompetitionStatus.SETUP;
  await competition.save();
  res.json(await detail(competition));
});

/* ───────────────────────────── Public ───────────────────────────── */

const PUBLIC_FIELDS = "name season sport description formSlug status createdAt";

// @desc    Competitions for the public page
// @route   GET /api/competitions/public
// @access  Public
export const listPublic = handle(async (_req, res) => {
  res.json(
    await Competition.find()
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .lean(),
  );
});

// @desc    Standings, fixtures and bracket — team names only
// @route   GET /api/competitions/public/:slug
// @access  Public
export const getPublic = handle(async (req, res) => {
  const competition = await Competition.findOne({
    formSlug: String(req.params.slug).toLowerCase(),
  })
    .select(PUBLIC_FIELDS)
    .lean();
  if (!competition) throw new HttpError(404, "Competition not found");

  const [teams, draws, form] = await Promise.all([
    teamsWithPlayers(competition._id, "name", PUBLIC_PLAYER_FIELDS),
    Draw.find({ competition: competition._id })
      .select("-createdBy")
      .populate(drawPopulate(PUBLIC_TEAM_FIELDS))
      .sort({ createdAt: 1 })
      .lean(),
    Form.findOne({ formId: competition.formSlug }).select("isActive").lean(),
  ]);
  res.json({
    competition,
    teams,
    draws,
    registrationOpen:
      competition.status === CompetitionStatus.SETUP && !!form?.isActive,
  });
});
