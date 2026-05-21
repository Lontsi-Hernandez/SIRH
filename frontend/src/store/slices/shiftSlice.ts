import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { shiftApi } from '../../services/api.service';

export interface Shift {
  id: string;
  employeeId: string;
  startTime: string;
  endTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT' | 'CANCELLED';
  location?: string;
  locationLat?: number;
  locationLng?: number;
  notes?: string;
  isOvertime: boolean;
  overtimeRate: number;
  breakDurationMinutes: number;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ShiftState {
  list: Shift[];
  currentActiveEntry: any | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ShiftState = {
  list: [],
  currentActiveEntry: null,
  isLoading: false,
  error: null,
};

// ── Thunks asynchrones ───────────────────────────────────────────────────────

export const fetchShifts = createAsyncThunk(
  'shifts/fetchAll',
  async (filters: { startDate: string; endDate: string; employeeId?: string }, { rejectWithValue }) => {
    try {
      const response = await shiftApi.getAll(filters);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors du chargement des horaires.');
    }
  }
);

export const createShift = createAsyncThunk(
  'shifts/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await shiftApi.create(data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors de la planification.');
    }
  }
);

export const updateShift = createAsyncThunk(
  'shifts/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await shiftApi.update(id, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors de la modification.');
    }
  }
);

export const deleteShift = createAsyncThunk(
  'shifts/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await shiftApi.delete(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  }
);

export const clockIn = createAsyncThunk(
  'shifts/clockIn',
  async (data: { shiftId: string; latitude?: number; longitude?: number; qrCodeToken: string }, { rejectWithValue }) => {
    try {
      const response = await shiftApi.clockIn(data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors du pointage d\'arrivée.');
    }
  }
);

export const clockOut = createAsyncThunk(
  'shifts/clockOut',
  async (data: { shiftId: string; latitude?: number; longitude?: number; qrCodeToken: string }, { rejectWithValue }) => {
    try {
      const response = await shiftApi.clockOut(data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors du pointage de départ.');
    }
  }
);

export const startBreak = createAsyncThunk(
  'shifts/startBreak',
  async (shiftId: string, { rejectWithValue }) => {
    try {
      const response = await shiftApi.startBreak(shiftId);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors du début de la pause.');
    }
  }
);

export const endBreak = createAsyncThunk(
  'shifts/endBreak',
  async (shiftId: string, { rejectWithValue }) => {
    try {
      const response = await shiftApi.endBreak(shiftId);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors de la fin de la pause.');
    }
  }
);

const shiftSlice = createSlice({
  name: 'shifts',
  initialState,
  reducers: {
    clearShiftError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchShifts
      .addCase(fetchShifts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchShifts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchShifts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // createShift
      .addCase(createShift.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      // updateShift
      .addCase(updateShift.fulfilled, (state, action) => {
        const index = state.list.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      // deleteShift
      .addCase(deleteShift.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s.id !== action.payload);
      })
      // clockIn
      .addCase(clockIn.fulfilled, (state, action) => {
        state.currentActiveEntry = action.payload;
        // Mettre à jour localement le statut du shift à IN_PROGRESS
        const shiftId = action.meta.arg.shiftId;
        const shift = state.list.find((s) => s.id === shiftId);
        if (shift) {
          shift.status = 'IN_PROGRESS';
        }
      })
      // clockOut
      .addCase(clockOut.fulfilled, (state, action) => {
        state.currentActiveEntry = null;
        const shiftId = action.meta.arg.shiftId;
        const shift = state.list.find((s) => s.id === shiftId);
        if (shift) {
          shift.status = 'COMPLETED';
        }
      })
      // startBreak
      .addCase(startBreak.fulfilled, (state, action) => {
        const updatedShift = action.payload;
        const index = state.list.findIndex((s) => s.id === updatedShift.id);
        if (index !== -1) {
          state.list[index] = updatedShift;
        }
      })
      // endBreak
      .addCase(endBreak.fulfilled, (state, action) => {
        const updatedShift = action.payload;
        const index = state.list.findIndex((s) => s.id === updatedShift.id);
        if (index !== -1) {
          state.list[index] = updatedShift;
        }
      });
  },
});

export const { clearShiftError } = shiftSlice.actions;
export default shiftSlice.reducer;
