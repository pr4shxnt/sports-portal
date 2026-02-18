import { Request, Response } from "express";
import NotificationList from "../models/NotificationList.js";

export const getAnnouncementStatus = async (req: Request, res: Response) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(401).json({ message: "Not authorized" });

    const list = await NotificationList.findOne({ name: "announcements" });
    const isSubscribed = list ? list.emails.includes(email) : false;

    res.json({ isSubscribed });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const toggleAnnouncementSubscription = async (
  req: Request,
  res: Response,
) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(401).json({ message: "Not authorized" });

    let list = await NotificationList.findOne({ name: "announcements" });
    if (!list) {
      list = await NotificationList.create({
        name: "announcements",
        emails: [],
      });
    }

    const emailIndex = list.emails.indexOf(email);
    if (emailIndex > -1) {
      list.emails.splice(emailIndex, 1);
    } else {
      list.emails.push(email);
    }

    await list.save();
    res.json({ isSubscribed: emailIndex === -1 });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
