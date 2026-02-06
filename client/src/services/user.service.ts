import api from "./api";
import type { User } from "../types";
import { UserRole } from "../types";

export const userService = {
  // Get all users (Admin/Superuser/Moderator)
  getAll: async (role?: UserRole): Promise<User[]> => {
    const params = role ? { role } : {};
    const response = await api.get<User[]>("/users", { params });
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
};
