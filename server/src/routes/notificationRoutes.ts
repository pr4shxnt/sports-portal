import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getAnnouncementStatus,
  toggleAnnouncementSubscription,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);

router.get("/announcements/status", getAnnouncementStatus);
router.post("/announcements/toggle", toggleAnnouncementSubscription);

export default router;
