import express from "express";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getMyEvents,
} from "../controllers/eventController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { UserRole } from "../models/User.js";

const router = express.Router();

router.get("/", getEvents);
router.post("/", protect, authorize(UserRole.ADMIN), createEvent);
router.put("/:id", protect, authorize(UserRole.ADMIN), updateEvent);
router.delete("/:id", protect, authorize(UserRole.ADMIN), deleteEvent);

router.post("/:id/register", protect, registerForEvent);
router.get("/my", protect, getMyEvents);

export default router;
