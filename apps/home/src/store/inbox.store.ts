import { create } from "zustand";

interface InboxState {
	unreadMessages: number;
	unreadNotifications: number;
	setUnreadMessages: (count: number) => void;
	setUnreadNotifications: (count: number) => void;
	resetInbox: () => void;
}

export const useInboxStore = create<InboxState>((set) => ({
	unreadMessages: 0,
	unreadNotifications: 0,
	setUnreadMessages: (count) => set({ unreadMessages: count }),
	setUnreadNotifications: (count) => set({ unreadNotifications: count }),
	resetInbox: () => set({ unreadMessages: 0, unreadNotifications: 0 })
}));
