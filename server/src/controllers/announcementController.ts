import { Request, Response } from "express";
import Announcement from "../models/Announcement.js";

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await Announcement.find({})
      .sort({ createdAt: -1 })
      .populate("author", "name role");
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Admin, Superuser, Moderator
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, content, targetRole } = req.body;
    const announcement = await Announcement.create({
      title,
      content,
      author: req.user?._id,
      targetRole,
    });
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Admin
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement)
      return res.status(404).json({ message: "Announcement not found" });

    await announcement.deleteOne();
    res.json({ message: "Announcement removed" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
