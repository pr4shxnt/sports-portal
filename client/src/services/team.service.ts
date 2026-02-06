import api from "./api";
import type { Team, TeamCreate } from "../types";

export const teamService = {
  // Get all teams (Admin/Superuser/Moderator)
  getAll: async (): Promise<Team[]> => {
    const response = await api.get<Team[]>("/teams");
    return response.data;
  },

  // Get my team
  getMyTeam: async (): Promise<Team> => {
    const response = await api.get<Team>("/teams/my");
    return response.data;
  },

  // Create team (Admin)
  create: async (data: TeamCreate): Promise<Team> => {
    const response = await api.post<Team>("/teams", data);
    return response.data;
  },

  // Update team (Admin)
  update: async (id: string, data: Partial<TeamCreate>): Promise<Team> => {
    const response = await api.put<Team>(`/teams/${id}`, data);
    return response.data;
  },

  // Delete team (Admin)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },
};
