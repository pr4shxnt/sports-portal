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
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { UserRole } from "../models/User.js";
import { validateBody } from "../middlewares/validateRequest.js";
import {
  createCompetitionSchema,
  leagueTeamSchema,
  updateCompetitionSchema,
} from "../schemas/index.js";

const router = express.Router();

// Public: read-only standings and bracket.
router.get("/public", listPublic);
router.get("/public/:slug", getPublic);

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

export default router;
