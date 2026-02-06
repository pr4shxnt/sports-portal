import api from "./api";
import type { Event, EventCreate } from "../types";

export const eventService = {
  // Get all events
  getAll: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>("/events");
    return response.data;
  },

  // Get my registered events
  getMyEvents: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>("/events/my");
    return response.data;
  },

  // Create event (Admin)
  create: async (data: EventCreate): Promise<Event> => {
    const response = await api.post<Event>("/events", data);
    return response.data;
  },

  // Update event (Admin)
  update: async (id: string, data: Partial<EventCreate>): Promise<Event> => {
    const response = await api.put<Event>(`/events/${id}`, data);
    return response.data;
  },

  // Delete event (Admin)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  // Register for event
  register: async (id: string): Promise<{ message: string }> => {
    const response = await api.post(`/events/${id}/register`);
    return response.data;
  },
};
