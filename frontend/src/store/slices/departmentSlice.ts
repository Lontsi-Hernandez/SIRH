import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api.service';

export interface Department {
  id: string;
  name: string;
  description?: string;
  code?: string;
  managerId?: string;
  manager?: { id: string; firstName: string; lastName: string; role: string };
  assistantManagerIds?: string[];
  parentDepartmentId?: string;
  branchId?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  employeeCount?: number;
}

interface DepartmentState {
  list: Department[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DepartmentState = {
  list: [],
  isLoading: false,
  error: null,
};

export const fetchDepartments = createAsyncThunk(
  'departments/fetchAll',
  async (branchId: string | undefined | null, { rejectWithValue }) => {
    try {
      const url = branchId ? `/departments?branchId=${branchId}` : '/departments';
      const res = await apiClient.get(url);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur de chargement des départements');
    }
  },
);

export const createDepartment = createAsyncThunk(
  'departments/create',
  async (data: { name: string; description?: string; code?: string; managerId?: string; branchId?: string }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/departments', data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur de création');
    }
  },
);

export const updateDepartment = createAsyncThunk(
  'departments/update',
  async ({ id, data }: { id: string; data: Partial<Department> }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/departments/${id}`, data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur de mise à jour');
    }
  },
);

export const deleteDepartment = createAsyncThunk(
  'departments/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/departments/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur de suppression');
    }
  },
);

export const assignDepartmentManager = createAsyncThunk(
  'departments/assignManager',
  async ({ deptId, managerId }: { deptId: string; managerId: string }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/departments/${deptId}/manager`, { managerId });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors de l\'assignation');
    }
  },
);

export const addAssistantManager = createAsyncThunk(
  'departments/addAssistant',
  async ({ deptId, assistantId }: { deptId: string; assistantId: string }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/departments/${deptId}/assistants`, { assistantId });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'assistant');
    }
  },
);

export const removeAssistantManager = createAsyncThunk(
  'departments/removeAssistant',
  async ({ deptId, assistantId }: { deptId: string; assistantId: string }, { rejectWithValue }) => {
    try {
      const res = await apiClient.delete(`/departments/${deptId}/assistants/${assistantId}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur lors du retrait de l\'assistant');
    }
  },
);

const departmentSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const idx = state.list.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.list = state.list.filter((d) => d.id !== action.payload);
      })
      .addCase(assignDepartmentManager.fulfilled, (state, action) => {
        const idx = state.list.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(addAssistantManager.fulfilled, (state, action) => {
        const idx = state.list.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(removeAssistantManager.fulfilled, (state, action) => {
        const idx = state.list.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      });
  },
});

export const { clearError } = departmentSlice.actions;
export default departmentSlice.reducer;
