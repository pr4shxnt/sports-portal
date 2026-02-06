import api from "./api";
import type { Announcement } from "../types";
import type { AnnouncementCreate } from "../types";
import type { Report } from "../types";
import type { ReportCreate } from "../types";

export const announcementService = {
  // Get all announcements
  getAll: async (): Promise<Announcement[]> => {
    const response = await api.get<Announcement[]>("/announcements");
    return response.data;
  },

  // Create announcement (Admin/Superuser/Moderator)
  create: async (data: AnnouncementCreate): Promise<Announcement> => {
    const response = await api.post<Announcement>("/announcements", data);
    return response.data;
  },

  // Delete announcement (Admin)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/announcements/${id}`);
  },
};

export const reportService = {
  // Submit report (bug/feedback)
  submit: async (data: ReportCreate): Promise<Report> => {
    const response = await api.post<Report>("/reports", data);
    return response.data;
  },

  // Get all reports (Admin)
  getAll: async (): Promise<Report[]> => {
    const response = await api.get<Report[]>("/reports");
    return response.data;
  },

  // Update report status (Admin)
  updateStatus: async (
    id: string,
    status: "pending" | "reviewed" | "resolved",
  ): Promise<Report> => {
    const response = await api.put<Report>(`/reports/${id}`, { status });
    return response.data;
  },
};
