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
import {
  createNews,
  deleteNews,
  getNews,
  getPublicNews,
  listNews,
  listPublicNews,
  updateNews,
} from "../controllers/newsController.js";
import {
  cancelTransfer,
  checkTransferRoute,
  createSanction,
  createTransfer,
  createWindow,
  deleteWindow,
  getMarket,
  getPublicMarket,
  revokeSanction,
  setValues,
} from "../controllers/transferController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { UserRole } from "../models/User.js";
import { validateBody } from "../middlewares/validateRequest.js";
import {
  createCompetitionSchema,
  createNewsSchema,
  cancelTransferSchema,
  sanctionSchema,
  transferCheckSchema,
  transferValuesSchema,
  transferWindowSchema,
  updateNewsSchema,
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
router.get("/public/:slug/news", listPublicNews);
router.get("/public/:slug/market", getPublicMarket);
router.get("/public/:slug/news/:postSlug", getPublicNews);

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

// Transfer market
router.get("/:id/market", getMarket);
router.post(
  "/:id/market/windows",
  validateBody(transferWindowSchema),
  createWindow,
);
router.delete("/:id/market/windows/:windowId", deleteWindow);
router.put("/:id/market/values", validateBody(transferValuesSchema), setValues);
router.post(
  "/:id/market/check",
  validateBody(transferCheckSchema),
  checkTransferRoute,
);
router.post(
  "/:id/market/transfers",
  validateBody(transferCheckSchema),
  createTransfer,
);
router.post(
  "/:id/market/transfers/:transferId/cancel",
  validateBody(cancelTransferSchema),
  cancelTransfer,
);
router.post(
  "/:id/market/sanctions",
  validateBody(sanctionSchema),
  createSanction,
);
router.post("/:id/market/sanctions/:sanctionId/revoke", revokeSanction);

// News
router.get("/:id/news", listNews);
router.post("/:id/news", validateBody(createNewsSchema), createNews);
router.get("/:id/news/:postId", getNews);
router.put("/:id/news/:postId", validateBody(updateNewsSchema), updateNews);
router.delete("/:id/news/:postId", deleteNews);

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
