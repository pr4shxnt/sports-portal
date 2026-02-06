import { Request, Response } from "express";
import Event from "../models/Event.js";
import { UserRole } from "../models/User.js";

// @desc    Get all events
// @route   GET /api/events
// @access  Public or Private (Requirements imply all roles can view all events eventually)
export const getEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.find({}).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Admin
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, date, location } = req.body;
    const event = await Event.create({
      title,
      description,
      date,
      location,
      organizer: req.user?._id,
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Admin
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    Object.assign(event, req.body);
    const updated = await event.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Admin
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    await event.deleteOne();
    res.json({ message: "Event removed" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
export const registerForEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (!req.user) return res.status(401).json({ message: "Not authorized" });

    if (
      event.participants
        .map((p) => p.toString())
        .includes(req.user._id.toString())
    ) {
      return res.status(400).json({ message: "Already registered" });
    }

    event.participants.push(req.user._id as any);
    await event.save();
    res.json({ message: "Registered successfully" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get my registered events
// @route   GET /api/events/my
// @access  Private
export const getMyEvents = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });

    const events = await Event.find({ participants: req.user._id });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
