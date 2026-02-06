import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { eventService } from "../../services/event.service";
import type { Event } from "../../types";

interface EventState {
  events: Event[];
  myEvents: Event[];
  loading: boolean;
  error: string | null;
}

const initialState: EventState = {
  events: [],
  myEvents: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchEvents = createAsyncThunk(
  "events/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await eventService.getAll();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch events",
      );
    }
  },
);

export const fetchMyEvents = createAsyncThunk(
  "events/fetchMy",
  async (_, { rejectWithValue }) => {
    try {
      return await eventService.getMyEvents();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch my events",
      );
    }
  },
);

export const registerForEvent = createAsyncThunk(
  "events/register",
  async (eventId: string, { rejectWithValue }) => {
    try {
      await eventService.register(eventId);
      return eventId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to register for event",
      );
    }
  },
);

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch events
    builder.addCase(fetchEvents.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      fetchEvents.fulfilled,
      (state, action: PayloadAction<Event[]>) => {
        state.loading = false;
        state.events = action.payload;
      },
    );
    builder.addCase(fetchEvents.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch my events
    builder.addCase(fetchMyEvents.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      fetchMyEvents.fulfilled,
      (state, action: PayloadAction<Event[]>) => {
        state.loading = false;
        state.myEvents = action.payload;
      },
    );
    builder.addCase(fetchMyEvents.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Register for event
    builder.addCase(registerForEvent.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(registerForEvent.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(registerForEvent.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError } = eventSlice.actions;
export default eventSlice.reducer;
