import { createSlice } from '@reduxjs/toolkit';
const leaveSlice = createSlice({ name: 'leaves', initialState: { list: [], isLoading: false, error: null }, reducers: {} });
export default leaveSlice.reducer;
