import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState { sidebarOpen: boolean; theme: 'dark' | 'light'; }

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true, theme: 'dark' } as UiState,
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload; },
  },
});
export const { toggleSidebar, setSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;
