import express from "express";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController";
import { protect, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../models/User";

const router = express.Router();

router.use(protect);

router.get("/", getAnnouncements);
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.SUPERUSER, UserRole.MODERATOR),
  createAnnouncement,
);
router.delete("/:id", authorize(UserRole.ADMIN), deleteAnnouncement);

export default router;
