import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { equipmentService } from "../../services/equipment.service";
import type { Equipment, Responsibility, EquipmentRequest } from "../../types";

interface EquipmentState {
  equipment: Equipment[];
  responsibilities: Responsibility[];
  loading: boolean;
  error: string | null;
}

const initialState: EquipmentState = {
  equipment: [],
  responsibilities: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchEquipment = createAsyncThunk(
  "equipment/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await equipmentService.getAll();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch equipment",
      );
    }
  },
);

export const fetchResponsibilities = createAsyncThunk(
  "equipment/fetchResponsibilities",
  async (_, { rejectWithValue }) => {
    try {
      return await equipmentService.getResponsibilities();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch responsibilities",
      );
    }
  },
);

export const requestEquipment = createAsyncThunk(
  "equipment/request",
  async (data: EquipmentRequest, { rejectWithValue }) => {
    try {
      return await equipmentService.requestEquipment(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to request equipment",
      );
    }
  },
);

const equipmentSlice = createSlice({
  name: "equipment",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch equipment
    builder.addCase(fetchEquipment.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      fetchEquipment.fulfilled,
      (state, action: PayloadAction<Equipment[]>) => {
        state.loading = false;
        state.equipment = action.payload;
      },
    );
    builder.addCase(fetchEquipment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch responsibilities
    builder.addCase(fetchResponsibilities.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      fetchResponsibilities.fulfilled,
      (state, action: PayloadAction<Responsibility[]>) => {
        state.loading = false;
        state.responsibilities = action.payload;
      },
    );
    builder.addCase(fetchResponsibilities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Request equipment
    builder.addCase(requestEquipment.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      requestEquipment.fulfilled,
      (state, action: PayloadAction<Responsibility>) => {
        state.loading = false;
        state.responsibilities.push(action.payload);
      },
    );
    builder.addCase(requestEquipment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError } = equipmentSlice.actions;
export default equipmentSlice.reducer;
