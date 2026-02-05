import { Request, Response } from "express";
import Equipment, { IEquipment } from "../models/Equipment";
import Responsibility, { RequestStatus } from "../models/Responsibility";
import { UserRole } from "../models/User";

// --- Equipment Inventory ---

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Private
export const getEquipment = async (req: Request, res: Response) => {
  try {
    const equipment = await Equipment.find({});
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Add new equipment
// @route   POST /api/equipment
// @access  Admin, Superuser
export const addEquipment = async (req: Request, res: Response) => {
  try {
    const { name, category, quantity, condition, description } = req.body;
    const equipment = await Equipment.create({
      name,
      category,
      quantity,
      condition,
      description,
    });
    res.status(201).json(equipment);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Admin, Superuser
export const updateEquipment = async (req: Request, res: Response) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment)
      return res.status(404).json({ message: "Equipment not found" });

    Object.assign(equipment, req.body);
    const updated = await equipment.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Admin
export const deleteEquipment = async (req: Request, res: Response) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment)
      return res.status(404).json({ message: "Equipment not found" });

    await equipment.deleteOne();
    res.json({ message: "Equipment removed" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// --- Responsibilities / Requests ---

// @desc    Request equipment
// @route   POST /api/equipment/request
// @access  All Users
export const requestEquipment = async (req: Request, res: Response) => {
  try {
    const { equipmentId, quantity, notes } = req.body;

    const equip = await Equipment.findById(equipmentId);
    if (!equip) return res.status(404).json({ message: "Equipment not found" });

    if (equip.quantity < quantity) {
      return res.status(400).json({ message: "Not enough quantity available" });
    }

    const responsibility = await Responsibility.create({
      user: req.user?._id,
      equipment: equipmentId,
      quantity,
      notes,
      status: RequestStatus.PENDING,
    });

    // Should we reserve quantity now or on approval?
    // Usually on approval.

    res.status(201).json(responsibility);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get Responsibilities (My requests or All for mods/admins)
// @route   GET /api/equipment/responsibilities
// @access  Private
export const getResponsibilities = async (req: Request, res: Response) => {
  try {
    let query = {};
    // If regular user, only see own.
    // If Mod/Super/Admin, can see all?
    // Mod: "View responsibilities"
    // Superuser: "View responsibilities"
    // Admin: "View responsibilities"
    // User: "My team" (doesn't explicitly say view responsibilities in dashboard sidebar, but features say "Responsibilities transfer")

    if (req.user?.role === UserRole.USER) {
      query = { user: req.user._id };
    }
    // Else assume they can see all (maybe filter by status?)

    const responsibilities = await Responsibility.find(query)
      .populate("user", "name email role")
      .populate("equipment", "name category");

    res.json(responsibilities);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Update Responsibility Status (Approve/Reject/Return)
// @route   PUT /api/equipment/responsibilities/:id
// @access  Admin, Superuser, Moderator
export const updateResponsibilityStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const { status } = req.body; // approved, returned, etc.
    const resp = await Responsibility.findById(req.params.id);

    if (!resp) return res.status(404).json({ message: "Request not found" });

    // Logic for inventory adjustment
    const equip = await Equipment.findById(resp.equipment);

    if (
      status === RequestStatus.APPROVED &&
      resp.status === RequestStatus.PENDING
    ) {
      if (equip && equip.quantity >= resp.quantity) {
        equip.quantity -= resp.quantity;
        resp.issueDate = new Date();
        await equip.save();
      } else {
        return res
          .status(400)
          .json({ message: "Not enough inventory to approve" });
      }
    } else if (
      status === RequestStatus.RETURNED &&
      (resp.status === RequestStatus.APPROVED ||
        resp.status === RequestStatus.OVERDUE)
    ) {
      if (equip) {
        equip.quantity += resp.quantity;
        resp.returnDate = new Date();
        await equip.save();
      }
    }

    resp.status = status;
    await resp.save();
    res.json(resp);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
