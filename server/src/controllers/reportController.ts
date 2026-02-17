import { Request, Response } from "express";
import Report from "../models/Report.js";

// @desc    Submit a report (bug/feedback)
// @route   POST /api/reports
// @access  Private
export const submitReport = async (req: Request, res: Response) => {
  try {
    const { type, subject, description } = req.body;
    const report = await Report.create({
      user: req.user?._id,
      type,
      subject,
      description,
    });
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get all reports
// @route   GET /api/reports
// @access  Admin
export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await Report.find({})
      .sort({ createdAt: -1 })
      .populate("user", "name email role");
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Update report status
// @route   PUT /api/reports/:id
// @access  Admin
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (req.body.status) {
      report.status = req.body.status.toLowerCase() as any;
    }
    const updated = await report.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
