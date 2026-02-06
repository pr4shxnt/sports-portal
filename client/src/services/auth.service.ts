import api from "./api";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from "../types";

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },

  // Register
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>("/auth/profile");
    return response.data;
  },

  // Logout
  logout: async () => {
    await api.post("/auth/logout");
  },

  // Get current user from localStorage (Deprecated: Always null)
  getCurrentUser: (): AuthResponse | null => {
    return null;
  },

  // Check if user is authenticated (Deprecated: Always false initially)
  isAuthenticated: (): boolean => {
    return false;
  },
};
