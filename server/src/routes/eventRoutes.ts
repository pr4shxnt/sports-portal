import express from "express";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getMyEvents,
} from "../controllers/eventController";
import { protect, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../models/User";

const router = express.Router();

router.use(protect);

router.get("/", getEvents);
router.post("/", authorize(UserRole.ADMIN), createEvent);
router.put("/:id", authorize(UserRole.ADMIN), updateEvent);
router.delete("/:id", authorize(UserRole.ADMIN), deleteEvent);

router.post("/:id/register", registerForEvent);
router.get("/my", getMyEvents);

export default router;
