import express from "express";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { UserRole } from "../models/User.js";

const router = express.Router();

router.use(protect);

router.get("/", getAnnouncements);
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.SUPERUSER),
  createAnnouncement,
);
router.delete("/:id", authorize(UserRole.ADMIN), deleteAnnouncement);

export default router;
