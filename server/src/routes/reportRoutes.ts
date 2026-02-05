import express from "express";
import {
  submitReport,
  getReports,
  updateReportStatus,
} from "../controllers/reportController";
import { protect, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../models/User";

const router = express.Router();

router.use(protect);

router.post("/", submitReport);
router.get("/", authorize(UserRole.ADMIN), getReports);
router.put("/:id", authorize(UserRole.ADMIN), updateReportStatus);

export default router;
