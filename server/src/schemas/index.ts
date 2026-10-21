import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["user", "moderator", "superuser", "admin"]).optional(),
  phone: z.string().optional(),
  studentId: z.string().optional(),
});

export const otpRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  formId: z.string().optional(),
});

export const otpVerifySchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const formSubmissionSchema = z
  .object({
    name: z.string().min(2, "Name is required").optional(),
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().optional(),
    collegeId: z.string().optional(),
    // Add other common fields or keep it flexible for dynamic forms
  })
  .passthrough();

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const createDrawSchema = z.object({
  event: objectId,
  format: z.enum(["Group", "Knockout", "League"]),
  sport: z.string().min(1, "Sport is required"),
  teamSize: z.number().int().positive().optional(),
  scoring: z.enum(["football", "winOnly"]).optional(),
  drawnTeams: z.array(objectId).min(2, "A draw needs at least 2 teams"),
  groupings: z
    .array(z.object({ name: z.string().min(1), teams: z.array(objectId) }))
    .optional(),
});

export const advanceDrawSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("groups"),
    qualifiers: z.number().int().min(2),
    groupSize: z.number().int().min(2),
  }),
  z.object({
    mode: z.literal("playIn"),
    direct: z.number().int().min(1),
    groupSize: z.number().int().min(2),
    perGroup: z.number().int().min(1).optional(),
  }),
  z.object({
    mode: z.literal("knockout"),
    qualifiers: z.number().int().min(2).optional(),
    seeding: z.enum(["ranked", "draw"]).optional(),
    perGroup: z.number().int().min(1).optional(),
    bestPlaced: z.number().int().min(0).optional(),
  }),
]);

export const requestWindowSchema = z.object({
  mode: z.enum(["scheduled", "open", "closed"]).optional(),
  openHour: z.number().int().min(0).max(23).optional(),
  closeHour: z.number().int().min(1).max(24).optional(),
  note: z.string().max(200).optional(),
});

/* ── Champions League ── */

const slug = z
  .string()
  .trim()
  .min(1, "Form slug is required")
  .regex(
    /^[a-z0-9][a-z0-9-_]*$/i,
    "Slug may only use letters, numbers, - and _",
  );

export const createCompetitionSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  season: z.string().trim().max(40).optional(),
  sport: z.string().trim().min(1, "Sport is required"),
  description: z.string().trim().max(2000).optional(),
  formSlug: slug,
});

export const updateCompetitionSchema = createCompetitionSchema.partial();

const optionalText = (max: number) => z.string().trim().max(max).optional();

const leaguePlayer = z.object({
  _id: objectId.optional(),
  name: z.string().trim().min(1, "Player name is required").max(80),
  email: optionalText(120),
  phone: optionalText(30),
  studentId: optionalText(40),
  programme: optionalText(80),
  intake: optionalText(40),
  shirtNumber: z.number().int().min(1).max(99).nullable().optional(),
  position: z.enum(["GK", "FP"]).optional(),
  captaincy: z.enum(["captain", "vice"]).nullable().optional(),
  photo: z
    .object({ url: z.string().url(), publicId: z.string().min(1) })
    .nullable()
    .optional(),
});

export const leagueTeamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required").max(80),
  players: z.array(leaguePlayer).max(30).optional(),
});

/* ── News ── */

const newsFields = {
  title: z.string().trim().min(3, "Title is required").max(140),
  category: z.enum(["match_report", "announcement", "feature"]).optional(),
  summary: z.string().trim().max(300).optional(),
  body: z.string().max(20000).optional(),
  status: z.enum(["draft", "published"]).optional(),
  cover: z
    .object({ url: z.string().url(), publicId: z.string().min(1) })
    .nullable()
    .optional(),
  match: objectId.nullable().optional(),
};

export const createNewsSchema = z.object(newsFields);
export const updateNewsSchema = z.object(newsFields).partial();

/* ── Match centre ── */

export const openMatchSchema = z.object({
  drawId: objectId,
  matchId: z.string().min(1).max(200),
  home: objectId,
  away: objectId,
});

export const updateMatchSchema = z.object({
  kickoff: z.string().datetime({ offset: true }).nullable().optional(),
  venue: z.string().trim().max(120).optional(),
  status: z.enum(["scheduled", "live", "finished"]).optional(),
  forfeitedBy: objectId.nullable().optional(),
  goalkeepers: z
    .object({
      home: objectId.nullable().optional(),
      away: objectId.nullable().optional(),
    })
    .optional(),
});

export const matchEventSchema = z.object({
  type: z.enum([
    "goal",
    "penalty_goal",
    "own_goal",
    "penalty_missed",
    "yellow",
    "red",
  ]),
  team: objectId,
  player: objectId.optional(),
  minute: z.number().int().min(1).max(50),
  saved: z.boolean().optional(),
});

export const shootoutSchema = z.object({
  kicks: z
    .array(
      z.object({
        team: objectId,
        player: objectId.optional(),
        scored: z.boolean(),
        saved: z.boolean().optional(),
      }),
    )
    .max(60),
});
