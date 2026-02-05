import { Request, Response } from "express";
import User, { UserRole } from "../models/User";
import Equipment from "../models/Equipment";
import Event from "../models/Event";
import Team from "../models/Team";
import Responsibility, { RequestStatus } from "../models/Responsibility";
import Announcement from "../models/Announcement";

// @desc    Get dashboard summary based on role
// @route   GET /api/dashboard/summary
// @access  Private
export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?._id;

    const data: any = {};

    // Common data
    data.announcements = await Announcement.find({})
      .sort({ createdAt: -1 })
      .limit(5);
    data.upcomingEvents = await Event.find({ date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(5);

    if (role === UserRole.ADMIN) {
      data.totalUsers = await User.countDocuments();
      data.totalEquipment = await Equipment.countDocuments();
      data.totalTeams = await Team.countDocuments();
      data.pendingRequests = await Responsibility.countDocuments({
        status: RequestStatus.PENDING,
      });
    } else if (role === UserRole.SUPERUSER) {
      data.totalEquipment = await Equipment.countDocuments();
      data.managedResponsibilities = await Responsibility.countDocuments({
        status: { $ne: RequestStatus.RETURNED },
      });
    } else if (role === UserRole.MODERATOR) {
      data.membersCount = await User.countDocuments({ role: UserRole.USER });
      data.myTeam = await Team.findOne({ executive: userId }).populate(
        "members",
        "name",
      );
    } else {
      // Regular User
      data.myRegisteredEventsCount = await Event.countDocuments({
        participants: userId,
      });
      data.myTeam = await Team.findOne({ members: userId }).populate(
        "members",
        "name",
      );
      data.myRequestsCount = await Responsibility.countDocuments({
        user: userId,
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
