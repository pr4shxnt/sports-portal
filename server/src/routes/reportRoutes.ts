import express from "express";
import {
  submitReport,
  getReports,
  updateReportStatus,
} from "../controllers/reportController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { UserRole } from "../models/User.js";

const router = express.Router();

router.use(protect);

router.post("/", submitReport);
router.get("/", authorize(UserRole.ADMIN, UserRole.MODERATOR), getReports);
router.put(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  updateReportStatus,
);

export default router;
