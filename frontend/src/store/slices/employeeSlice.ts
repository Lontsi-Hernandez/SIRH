import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api.service';

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  status: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ARCHIVED';
  role: 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
  hireDate: string;
  departmentId?: string;
  branchId?: string;
  positionId?: string;
  managerId?: string;
  hourlyRate?: number;
  annualSalary?: number;
  department?: { id: string; name: string };
  position?: { id: string; title: string };
  manager?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  customAttributes?: Record<string, any>;
}

interface EmployeeState {
  list: Employee[];
  selected: Employee | null;
  total: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  list: [],
  selected: null,
  total: 0,
  totalPages: 0,
  currentPage: 1,
  isLoading: false,
  error: null,
};

export const fetchEmployees = createAsyncThunk(
  'employees/fetchAll',
  async (
    filters: { page?: number; limit?: number; search?: string; departmentId?: string; branchId?: string; status?: string; role?: string } | undefined,
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.departmentId) params.append('departmentId', filters.departmentId);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.role) params.append('role', filters.role);

      const res = await apiClient.get(`/employees?${params.toString()}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur de chargement des employés');
    }
  },
);

export const fetchEmployeeById = createAsyncThunk(
  'employees/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/employees/${id}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Employé introuvable');
    }
  },
);

export const createEmployee = createAsyncThunk(
  'employees/create',
  async (data: Partial<Employee>, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/employees', data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur de création');
    }
  },
);

export const updateEmployee = createAsyncThunk(
  'employees/update',
  async ({ id, data }: { id: string; data: Partial<Employee> }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/employees/${id}`, data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur de mise à jour');
    }
  },
);

export const deleteEmployee = createAsyncThunk(
  'employees/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/employees/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur de suppression');
    }
  },
);

export const onboardEmployee = createAsyncThunk(
  'employees/onboard',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/employees/${id}/onboard`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur d\'onboarding');
    }
  },
);

export const offboardEmployee = createAsyncThunk(
  'employees/offboard',
  async ({ id, terminationDate, reason }: { id: string; terminationDate: string; reason: string }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/employees/${id}/offboard`, { terminationDate, reason });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erreur d\'offboarding');
    }
  },
);

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setSelected(state, action: PayloadAction<Employee | null>) {
      state.selected = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => { state.isLoading = true; })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload.data;
        state.total = action.payload.meta.total;
        state.totalPages = action.payload.meta.totalPages;
        state.currentPage = action.payload.meta.page;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.total++;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const idx = state.list.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.list = state.list.filter((e) => e.id !== action.payload);
        state.total--;
      })
      .addCase(onboardEmployee.fulfilled, (state, action) => {
        const idx = state.list.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(offboardEmployee.fulfilled, (state, action) => {
        const idx = state.list.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      });
  },
});

export const { setSelected, clearError } = employeeSlice.actions;
export default employeeSlice.reducer;

