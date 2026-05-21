import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api.service';

export interface Branch {
  id: string;
  name: string;
  code?: string;
  address?: string;
  managerId?: string;
  manager?: { id: string; firstName: string; lastName: string; role: string };
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

interface BranchState {
  list: Branch[];
  isLoading: boolean;
  error: string | null;
  selectedBranchId: string | null; // Pour le filtre global UI
}

const initialState: BranchState = {
  list: [],
  isLoading: false,
  error: null,
  selectedBranchId: null,
};

export const fetchBranches = createAsyncThunk(
  'branches/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/branches');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur de chargement des succursales');
    }
  },
);

export const createBranch = createAsyncThunk(
  'branches/create',
  async (data: { name: string; code?: string; address?: string; managerId?: string }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/branches', data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur de création');
    }
  },
);

export const updateBranch = createAsyncThunk(
  'branches/update',
  async ({ id, data }: { id: string; data: Partial<Branch> }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/branches/${id}`, data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur de mise à jour');
    }
  },
);

export const deleteBranch = createAsyncThunk(
  'branches/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/branches/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur de suppression');
    }
  },
);

const branchSlice = createSlice({
  name: 'branches',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    setSelectedBranch(state, action) { state.selectedBranchId = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranches.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createBranch.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateBranch.fulfilled, (state, action) => {
        const idx = state.list.findIndex((b) => b.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.list = state.list.filter((b) => b.id !== action.payload);
      });
  },
});

export const { clearError, setSelectedBranch } = branchSlice.actions;
export default branchSlice.reducer;
