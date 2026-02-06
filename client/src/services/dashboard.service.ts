import api from "./api";
import type { DashboardSummary } from "../types";

export const dashboardService = {
  // Get dashboard summary (role-specific)
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get<DashboardSummary>("/dashboard/summary");
    return response.data;
  },
};
