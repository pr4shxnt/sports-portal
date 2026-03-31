import type { Request, Response } from "express";
import Meeting from "../models/Meeting.js";
import { sendMeetingInvitationEmail } from "../utils/emailHelper.js";

export const createMeeting = async (req: Request, res: Response) => {
  try {
    const {
      title,
      topic,
      type,
      venue,
      roomNo,
      meetingLink,
      date,
      time,
      participants, // array of emails or { email, name }
      recipientName, // optional greeting provided by frontend
      to,
      cc,
      bcc,
    } = req.body;

    if (!title || !topic || !type || !date || !time) {
      return res
        .status(400)
        .json({ message: "Title, topic, type, date and time are required" });
    }

    if (type === "physical" && !venue) {
      return res
        .status(400)
        .json({ message: "Venue is required for physical meetings" });
    }

    if (type === "virtual" && !meetingLink) {
      return res
        .status(400)
        .json({ message: "Meeting link is required for virtual meetings" });
    }

    if (!participants || participants.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one participant is required" });
    }

    const participantObjects = (participants as any[]).map((p) =>
      typeof p === "string" ? { email: p, name: undefined } : p,
    );

    const filteredParticipants = participantObjects.filter((p) => p?.email);
    if (filteredParticipants.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one participant email is required" });
    }

    const participantEmails = filteredParticipants.map((p) => p.email);

    const meeting = await Meeting.create({
      title,
      topic,
      type,
      venue,
      roomNo,
      meetingLink,
      date,
      time,
      participants: participantEmails,
      createdBy: req.user!._id,
    });

    // Determine location string
    const location =
      type === "virtual"
        ? meetingLink
        : `${venue}${roomNo ? `, Room ${roomNo}` : ""}`;

    try {
      await sendMeetingInvitationEmail({
        recipientName: recipientName || undefined,
        to,
        cc,
        bcc,
        title,
        topic,
        date,
        time,
        location: location || "",
        meetingLink: type === "virtual" ? meetingLink : undefined,
        type,
        venue,
        roomNo,
        allParticipants: filteredParticipants,
      });
    } catch (emailErr) {
      console.error("[Meeting] Failed to send meeting invitation:", emailErr);
    }

    res.status(201).json(meeting);
  } catch (error: any) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ message: "Failed to create meeting" });
  }
};

export const getMeetings = async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email;
    const userRole = req.user?.role;

    let meetings;

    // Admins see all meetings
    if (userRole === "admin") {
      meetings = await Meeting.find()
        .populate("createdBy", "name email")
        .sort({ date: -1 });
    } else {
      // Other users only see meetings they are participants of
      meetings = await Meeting.find({ participants: userEmail })
        .populate("createdBy", "name email")
        .sort({ date: -1 });
    }

    res.json(meetings);
  } catch (error: any) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ message: "Failed to fetch meetings" });
  }
};

export const getMeetingById = async (req: Request, res: Response) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json(meeting);
  } catch (error: any) {
    console.error("Error fetching meeting:", error);
    res.status(500).json({ message: "Failed to fetch meeting" });
  }
};

export const deleteMeeting = async (req: Request, res: Response) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    await meeting.deleteOne();
    res.json({ message: "Meeting deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ message: "Failed to delete meeting" });
  }
};
