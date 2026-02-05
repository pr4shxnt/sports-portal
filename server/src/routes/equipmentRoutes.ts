import express from "express";
import {
  getEquipment,
  addEquipment,
  updateEquipment,
  deleteEquipment,
  requestEquipment,
  getResponsibilities,
  updateResponsibilityStatus,
  transferEquipment,
} from "../controllers/equipmentController";
import { protect, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../models/User";

const router = express.Router();

router.use(protect);

// Inventory
router.get("/", getEquipment); // Viewable by all logged in? Dashboards say "View equipments" for Super/Admin. Mod doesn't say.
// Let's assume View only for all, but maybe restrict if needed.

router.post("/", authorize(UserRole.ADMIN, UserRole.SUPERUSER), addEquipment);
router.put(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.SUPERUSER),
  updateEquipment,
);
router.delete("/:id", authorize(UserRole.ADMIN), deleteEquipment);

// Responsibilities / Requests
router.post("/request", requestEquipment); // All users
router.get("/responsibilities", getResponsibilities); // Filtered inside controller
router.put(
  "/responsibilities/:id",
  authorize(UserRole.ADMIN, UserRole.SUPERUSER, UserRole.MODERATOR),
  updateResponsibilityStatus,
);

router.post("/transfer/:id", transferEquipment);

export default router;
