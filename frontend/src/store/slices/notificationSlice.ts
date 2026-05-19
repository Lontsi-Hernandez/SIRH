import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification { id: string; title: string; body: string; isRead: boolean; type: string; createdAt: string; }
interface NotificationState { items: Notification[]; unreadCount: number; }

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0 } as NotificationState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload);
      state.unreadCount++;
    },
    markAsRead(state, action: PayloadAction<string>) {
      const n = state.items.find((n) => n.id === action.payload);
      if (n && !n.isRead) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
    },
    markAllAsRead(state) {
      state.items.forEach((n) => { n.isRead = true; });
      state.unreadCount = 0;
    },
  },
});
export const { addNotification, markAsRead, markAllAsRead } = notificationSlice.actions;
export default notificationSlice.reducer;
