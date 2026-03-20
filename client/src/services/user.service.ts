import api from "./api";
import type { User } from "../types";
import { UserRole } from "../types";

export interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export const userService = {
  // Get paginated users (Admin/Superuser/Moderator)
  getAll: async (
    role?: UserRole,
    page = 1,
    limit = 12,
    q?: string,
  ): Promise<PaginatedUsersResponse> => {
    const params: Record<string, string | number> = { page, limit };
    if (role) params.role = role;
    if (q && q.trim().length >= 2) params.q = q.trim();
    const response = await api.get<PaginatedUsersResponse>("/users", {
      params,
    });
    return response.data;
  },

  // Get user by ID
  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  // Update user (Admin/Moderator)
  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },

  // Delete user (Admin)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  // Change own password
  changePassword: async (data: any): Promise<void> => {
    await api.put("/users/profile/password", data);
  },
};
