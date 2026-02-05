import express from "express";
import {
  getTeams,
  getMyTeam,
  createTeam,
  updateTeam,
  deleteTeam,
} from "../controllers/teamController";
import { protect, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../models/User";

const router = express.Router();

router.use(protect);

router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.SUPERUSER, UserRole.MODERATOR),
  getTeams,
);
router.get("/my", getMyTeam);
router.post("/", authorize(UserRole.ADMIN), createTeam);
router.put("/:id", authorize(UserRole.ADMIN), updateTeam);
router.delete("/:id", authorize(UserRole.ADMIN), deleteTeam);

export default router;
