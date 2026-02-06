import express from "express";
import {
  getForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  submitForm,
  getFormSubmissions,
  updateSubmissionStatus,
  getAllSubmissions,
} from "../controllers/formController.js";
import { sendOTP, verifyOTP } from "../controllers/otpController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { UserRole } from "../models/User.js";

const router = express.Router();

// Public routes
router.get("/", getForms);
router.get("/:formId", getFormById);
router.post("/otp/send", sendOTP);
router.post("/otp/verify", verifyOTP);

// Form management routes (Admin + Moderator)
router.post("/", protect, authorize(UserRole.ADMIN), createForm);
router.put(
  "/:formId",
  protect,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  updateForm,
);
router.delete("/:formId", protect, authorize(UserRole.ADMIN), deleteForm);

// Form submission routes
router.post("/:formId/submit", submitForm);
router.get(
  "/:formId/submissions",
  protect,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  getFormSubmissions,
);

// All submissions route
router.get(
  "/submissions/all",
  protect,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  getAllSubmissions,
);

// Submission status update
router.patch(
  "/submissions/:id/status",
  protect,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  updateSubmissionStatus,
);

export default router;
