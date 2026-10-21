import express from "express";
import {
  addTeam,
  createCompetition,
  deleteCompetition,
  getCompetition,
  getPublic,
  listCompetitions,
  listPublic,
  previewForm,
  removeTeam,
  resetCompetition,
  startLeague,
  syncTeams,
  updateCompetition,
  updateTeam,
} from "../controllers/competitionController.js";
import {
  addEvent,
  getMatch,
  getPublicMatch,
  getPublicStats,
  getStats,
  listMatches,
  listPublicMatches,
  openMatch,
  removeEvent,
  saveShootout,
  updateMatch,
} from "../controllers/matchController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { UserRole } from "../models/User.js";
import { validateBody } from "../middlewares/validateRequest.js";
import {
  createCompetitionSchema,
  leagueTeamSchema,
  matchEventSchema,
  openMatchSchema,
  shootoutSchema,
  updateCompetitionSchema,
  updateMatchSchema,
} from "../schemas/index.js";

const router = express.Router();

// Public: read-only standings and bracket.
router.get("/public", listPublic);
router.get("/public/:slug", getPublic);
router.get("/public/:slug/matches", listPublicMatches);
router.get("/public/:slug/matches/:matchDocId", getPublicMatch);
router.get("/public/:slug/stats", getPublicStats);

// Everything else is admin-only.
router.use(protect, authorize(UserRole.ADMIN));

router.get("/", listCompetitions);
router.get("/forms/:slug", previewForm);
router.post("/", validateBody(createCompetitionSchema), createCompetition);
router.get("/:id", getCompetition);
router.patch("/:id", validateBody(updateCompetitionSchema), updateCompetition);
router.delete("/:id", deleteCompetition);
router.post("/:id/sync", syncTeams);
router.post("/:id/start", startLeague);
router.post("/:id/reset", resetCompetition);
router.post("/:id/teams", validateBody(leagueTeamSchema), addTeam);
router.put("/:id/teams/:teamId", validateBody(leagueTeamSchema), updateTeam);
router.delete("/:id/teams/:teamId", removeTeam);

// Match centre
router.get("/:id/stats", getStats);
router.get("/:id/matches", listMatches);
router.post("/:id/matches/open", validateBody(openMatchSchema), openMatch);
router.get("/:id/matches/:matchDocId", getMatch);
router.patch(
  "/:id/matches/:matchDocId",
  validateBody(updateMatchSchema),
  updateMatch,
);
router.post(
  "/:id/matches/:matchDocId/events",
  validateBody(matchEventSchema),
  addEvent,
);
router.delete("/:id/matches/:matchDocId/events/:eventId", removeEvent);
router.put(
  "/:id/matches/:matchDocId/shootout",
  validateBody(shootoutSchema),
  saveShootout,
);

export default router;
